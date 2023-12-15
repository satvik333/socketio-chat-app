import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Avatar from 'react-avatar';

function KaptureAppBar({ loggedInUser }) {

  return (
    <AppBar position="static" sx={{ backgroundColor: '#e03038', height: '50px' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography variant="h4" component="h4" sx={{ color: 'white' }}>
            Kapture Internal Chat
          </Typography>
          <Typography variant="h6" component="h6" sx={{ color: 'white', pl: 106 }}>
            LoggedIn As: <Avatar name={loggedInUser?.name} round={true} size="35" textSizeRatio={1.75} /><span style={{paddingLeft: '5px'}}>{loggedInUser?.name}</span>
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default KaptureAppBar;
