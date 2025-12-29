import React from 'react';

const MarcaAgua = ({ userName }) => {
  return (
    <div className="hidden absolute bottom-2 right-4 text-[10px] text-gray-500 font-medium watermark">
      RegiTreno | @{userName}
    </div>
  );
};

export default MarcaAgua;