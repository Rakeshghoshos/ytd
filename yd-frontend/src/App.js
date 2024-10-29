// import axios from 'axios';
// import React, { useState } from 'react';

// function App() {
//   const [link, setLink] = useState(''); // For the YouTube link input
//   const [loading, setLoading] = useState(false); // To indicate download status

//   const handleSubmit = async () => {
//     setLoading(true);
//     try {
//       if (link !== '') {
//         const response = await axios.post('http://localhost:8080/downloadAudio', {
//           url: link, // Send the link in the POST request body
//         }, {
//           responseType: 'blob' // Receive the response as binary data (blob)
//         });

//         // Create a download link for the received file
//         const url = window.URL.createObjectURL(new Blob([response.data]));
//         const downloadLink = document.createElement('a');
//         downloadLink.href = url;
//         downloadLink.setAttribute('download', 'audio-file.mp3'); // Set file name
//         document.body.appendChild(downloadLink);
//         downloadLink.click();
//         downloadLink.remove();
//         window.URL.revokeObjectURL(url); // Clean up the URL object
//       } else {
//         console.log("Please enter a valid YouTube link.");
//       }
//     } catch (error) {
//       console.error("Error downloading audio:", error);
//     } finally {
//       setLoading(false); // Reset loading state
//     }
//   };

//   return (
//     <div className="App">
//       <h1>YouTube Audio Downloader</h1>
//       <input
//         type="text"
//         placeholder="Enter YouTube link"
//         onChange={(e) => setLink(e.target.value)}
//       />
//       <br />
//       <button onClick={handleSubmit} disabled={loading}>
//         {loading ? 'Downloading...' : 'Download Audio'}
//       </button>
//     </div>
//   );
// }

// export default App;


import axios from 'axios';
import React, { useState } from 'react';

function App() {
  const [link, setLink] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (link !== '') {
        const response = await axios.post('http://localhost:8080/downloadVideo', {
          url: link,
          start_time: startTime, 
          end_time: endTime 
        }, {
          responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.setAttribute('download', 'video-file.mp4');
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.log("Please enter a valid YouTube link.");
      }
    } catch (error) {
      console.error("Error downloading video:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">

      <input
        type="text"
        placeholder="Enter YouTube link"
        onChange={(e) => setLink(e.target.value)}
      />
      <br />
      <input
        type="text"
        placeholder="Start Time (HH:MM:SS)"
        onChange={(e) => setStartTime(e.target.value)}
      />
      <br />
      <input
        type="text"
        placeholder="End Time (HH:MM:SS)"
        onChange={(e) => setEndTime(e.target.value)}
      />
      <br />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Downloading...' : 'Download Video'}
      </button>
    </div>
  );
}

export default App;

