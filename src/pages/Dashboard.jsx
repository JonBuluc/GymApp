import React from "react";
import WorkoutRecorder from "../components/workout/WorkoutRecorder";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* main content */}
      <main className="py-6">
        <WorkoutRecorder />
      </main>
    </div>
  );
};

export default Dashboard;
