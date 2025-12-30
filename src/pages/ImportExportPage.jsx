import React, { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../services/firebase';
import { collection, writeBatch, doc, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const ImportExportPage = () => {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({ msg: '', type: '' });

  // funcion generica para subir datos en lotes de 500
  const uploadInBatches = async (dataArray) => {
    let batch = writeBatch(db);
    let count = 0;
    let totalUploaded = 0;
    const total = dataArray.length;

    for (const item of dataArray) {
      const logRef = doc(collection(db, 'workout_logs'));
      batch.set(logRef, { ...item, userId: user.uid });
      count++;
      totalUploaded++;

      if (count === 500 || totalUploaded === total) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
        setProgress(Math.round((totalUploaded / total) * 100));
      }
    }
    return totalUploaded;
  };

  // importar desde el csv original de strong app
  const processStrongCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setStatus({ msg: 'procesando archivo de strong...', type: 'info' });

    Papa.parse(file, {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data.filter(row => row['Set Order'] && row['Set Order'] !== 'Rest Timer');
          const logsToUpload = rows.map(row => {
            const weightKg = parseFloat(row['Weight (kg)']);
            const weightLb = parseFloat(row['Weight (lbs)']);
            const weight = !isNaN(weightKg) ? weightKg : (!isNaN(weightLb) ? weightLb : 0);
            const unit = !isNaN(weightKg) ? 'kg' : 'lb';
            const reps = parseInt(row['Reps']) || 0;
            const rawDate = row['Date'] || new Date().toISOString();

            return {
              dateString: rawDate.split(' ')[0],
              createdAt: new Date(rawDate),
              exercise: row['Exercise Name'] || 'ejercicio desconocido',
              weight: weight,
              reps: reps,
              unit: unit,
              setOrder: parseInt(row['Set Order']) || 1,
              estimated1RM: parseFloat((weight * (1 + reps / 30)).toFixed(2)),
              isWarmup: false,
              isDropSet: false,
              originalRepLabel: reps,
              rpe: row['RPE'] ? parseFloat(row['RPE']) : null,
              muscleGroup: 'otros'
            };
          });

          const uploaded = await uploadInBatches(logsToUpload);
          setStatus({ msg: `exito: ${uploaded} series de strong importadas.`, type: 'success' });
        } catch (error) {
          setStatus({ msg: 'error al importar strong.', type: 'error' });
        } finally {
          setImporting(false);
          e.target.value = null;
        }
      }
    });
  };

  // importar un backup generado previamente por regitreno
  const processBackupCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setStatus({ msg: 'procesando backup de regitreno...', type: 'info' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const logsToUpload = results.data.map(row => ({
            ...row,
            weight: parseFloat(row.weight),
            reps: parseInt(row.reps),
            setOrder: parseInt(row.setOrder),
            estimated1RM: parseFloat(row.estimated1RM),
            originalRepLabel: parseInt(row.originalRepLabel),
            rpe: row.rpe ? parseFloat(row.rpe) : null,
            isWarmup: row.isWarmup === 'true',
            isDropSet: row.isDropSet === 'true',
            createdAt: new Date(row.createdAt)
          }));

          const uploaded = await uploadInBatches(logsToUpload);
          setStatus({ msg: `backup restaurado: ${uploaded} registros cargados.`, type: 'success' });
        } catch (error) {
          setStatus({ msg: 'error al restaurar el backup.', type: 'error' });
        } finally {
          setImporting(false);
          e.target.value = null;
        }
      }
    });
  };

  // exportar todos los campos del usuario menos el userid
  const exportUserData = async () => {
    if (!user) return;
    setExporting(true);
    setStatus({ msg: 'generando exportacion...', type: 'info' });

    try {
      const q = query(collection(db, 'workout_logs'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const flatData = [];

      querySnapshot.forEach(docSnap => {
        const { userId, ...data } = docSnap.data();
        flatData.push({
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        });
      });

      if (flatData.length === 0) {
        setStatus({ msg: 'no hay datos para exportar.', type: 'info' });
        return;
      }

      const csv = Papa.unparse(flatData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `regitreno_backup_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      setStatus({ msg: 'exportacion lista.', type: 'success' });
    } catch (error) {
      setStatus({ msg: 'error al exportar.', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const deleteAllUserData = async () => {
    if (!window.confirm('¿borrar todo? esta accion no se puede deshacer.')) return;
    setDeleting(true);
    setProgress(0);
    try {
      const q = query(collection(db, 'workout_logs'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const total = snap.size;
      let batch = writeBatch(db);
      let count = 0;
      let deleted = 0;

      for (const d of snap.docs) {
        batch.delete(d.ref);
        count++;
        deleted++;
        if (count === 500 || deleted === total) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
          setProgress(Math.round((deleted / total) * 100));
        }
      }
      setStatus({ msg: 'historial borrado con exito.', type: 'success' });
    } catch (e) {
      setStatus({ msg: 'error al borrar datos.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Centro de Datos</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <h2 className="text-blue-400 font-semibold mb-2">Importar Strong</h2>
            <input type="file" accept=".csv" onChange={processStrongCSV} disabled={importing || deleting} className="text-xs text-gray-400 cursor-pointer file:bg-blue-600 file:text-white file:px-3 file:py-1 file:rounded-full file:border-0" />
          </div>

          <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <h2 className="text-purple-400 font-semibold mb-2">Importar Backup RegiTreno</h2>
            <input type="file" accept=".csv" onChange={processBackupCSV} disabled={importing || deleting} className="text-xs text-gray-400 cursor-pointer file:bg-purple-600 file:text-white file:px-3 file:py-1 file:rounded-full file:border-0" />
          </div>

          <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600 flex flex-col justify-between">
            <h2 className="text-green-400 font-semibold mb-2">Exportar Todo</h2>
            <button onClick={exportUserData} disabled={exporting || importing} className="bg-green-600 text-white py-2 rounded-lg text-sm font-bold">Exportar CSV</button>
          </div>

          <div className="p-4 bg-red-900/10 rounded-lg border border-red-900/30 flex flex-col justify-between">
            <h2 className="text-red-500 font-semibold mb-2">Zona Peligrosa</h2>
            <button onClick={deleteAllUserData} disabled={deleting || importing} className="bg-red-600 text-white py-2 rounded-lg text-sm font-bold">Borrar Todo</button>
          </div>
        </div>

        {(importing || deleting) && (
          <div className="mt-6">
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-[10px] text-center text-gray-500 mt-1">{progress}% procesado</p>
          </div>
        )}

        {status.msg && (
          <div className={`mt-6 p-3 rounded-lg text-xs text-center font-medium ${status.type === 'error' ? 'bg-red-900/40 text-red-200' : 'bg-green-900/40 text-green-200'}`}>
            {status.msg}
          </div>
        )}
      </div>
      <p className="text-center text-gray-500 text-xs mt-4">puedes revisar y editar tu entrenamiento en la pagina del historial</p>
    </div>
  );
};

export default ImportExportPage;