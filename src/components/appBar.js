import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

function KaptureAppBar() {

  return (
    <AppBar position="static" sx={{ backgroundColor: '#e03038', height: '50px' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography variant="h4" component="h4" sx={{ color: 'white' }}>
            Kapture Internal Chat
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default KaptureAppBar;
