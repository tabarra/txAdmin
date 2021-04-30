import { Box, InputAdornment, makeStyles, TextField, Theme, Typography } from '@material-ui/core'
import { Search, SortByAlpha } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import React from 'react'



const useStyles = makeStyles((theme: Theme) => ({
  title: {
    fontWeight: 600
  },
  playerCount: {
    color: theme.palette.text.secondary,
    fontWeight: 500
  },
  icon: {
    color: theme.palette.text.secondary
  }
}))


const sortOptions = [
  {
    name: 'Distance',
    value: 'distance'
  },
  {
    name: 'ID (ascending)', 
    value: 'ascending'
  },
  {
    name: 'ID (descending)'
  }
]

export const PlayerPageHeader: React.FC = () => {
  const classes = useStyles();
  return (
    <Box display="flex" justifyContent="space-between">
      <Box>
        <Typography variant='h5' color="primary" className={classes.title}>ONLINE PLAYERS</Typography>
        <Typography className={classes.playerCount}>47/420 Players</Typography>
      </Box>
      <Box display="flex" alignItems="center" justifyContent="center" >
        <TextField
          placeholder="Search..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" className={classes.icon}>
                <Search color="inherit"/>
              </InputAdornment>
            )
          }}
          style={{ marginRight: 20 }}
        />
        <Autocomplete
          options={sortOptions}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Sort by..."
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start" className={classes.icon}>
                    <SortByAlpha color="inherit"/>
                  </InputAdornment>
                )
              }}
              style={{ marginRight: 20, width: 200 }}
            />
            )
          }
        />
        {/* <TextField
          placeholder="Sort by..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" className={classes.icon}>
                <SortByAlpha color="inherit"/>
              </InputAdornment>
            )
          }}
          style={{ marginRight: 20 }}
        /> */}
      </Box>
    </Box>
  )
}

{/* <InputAdornment position="start">
  <Search />
</InputAdornment> */}