import React from 'react';

const LiveStream = () => {
  return (
    <div className="my-6">
      <h2 className="text-lg font-semibold mb-2">Live Video Stream</h2>
      <div className="border rounded overflow-hidden w-full max-w-md">
        <img
          src="http://127.0.0.1:8000/video_feed"
          alt="Live Stream"
          className="w-full"
        />
      </div>
    </div>
  );
};

export default LiveStream;
