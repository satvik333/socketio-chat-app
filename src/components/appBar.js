import * as React from 'react';
import Typography from '@mui/material/Typography';
import Avatar from 'react-avatar';

function KaptureAppBar({ loggedInUser }) {
  return (
    <div style={{ backgroundColor: '#efefef', boxShadow: 'none', padding: '10px 15px', maxHeight: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '100vw' }}>
      <Typography variant="h4" component="h4" sx={{ color: 'black', mt: 0.5 }}>
        Kapture Socket.io
      </Typography>
      <Typography variant="h6" component="h6" sx={{ color: 'black', mt: 0.5 }}>
        You :{' '}
        <Avatar name={loggedInUser?.user_name} round={true} size="35" textSizeRatio={1.75} />
        <span style={{ marginLeft: '5px' }}>{loggedInUser?.user_name}</span>
      </Typography>
    </div>
  );
}

export default KaptureAppBar;
