import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Avatar from 'react-avatar';

function KaptureAppBar({ loggedInUser }) {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#e03038', height: '50px' }}>
      <Container
        maxWidth="xl"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" component="h4" sx={{ color: 'white', mt: 0.5, marginLeft: '-200px' }}>
          Kapture Internal Chat
        </Typography>
        <Typography variant="h6" component="h6" sx={{ color: 'white', mt: 0.5, marginRight: '-200px' }}>
          LoggedIn As :{' '}
          <Avatar name={loggedInUser?.name} round={true} size="35" textSizeRatio={1.75} />
          <span style={{ marginLeft: '5px' }}>{loggedInUser?.name}</span>
        </Typography>
      </Container>
    </AppBar>
  );
}

export default KaptureAppBar;
