import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
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
        <Typography variant="h4" component="h4" sx={{ color: 'white', pb: 2, marginLeft: '-48px' }}>
          Kapture Internal Chat
        </Typography>
        <Typography variant="h6" component="h6" sx={{ color: 'white', pb: 1 }}>
          LoggedIn As :{' '}
          <Avatar name={loggedInUser?.name} round={true} size="35" textSizeRatio={1.75} />
          <span style={{ marginLeft: '5px' }}>{loggedInUser?.name}</span>
        </Typography>
      </Container>
    </AppBar>
  );
}

export default KaptureAppBar;
