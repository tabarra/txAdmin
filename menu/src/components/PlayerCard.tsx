import { Box, makeStyles, Paper, Theme, Typography } from '@material-ui/core';
import React from 'react'

interface PlayerData {
  id: number;
  playerName: string;
  health?: number;
  armour?: number;
}

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    padding: 20
  },
  root: {
    display: 'flex',
  },
  bar: {
    background: theme.palette.primary.main,
    width: '100%',
    height: '5px',
    borderRadius: 10,
  }
}))

const PlayerCard: React.FC<PlayerData> = ({ id, playerName, health, armour }) => {
  const classes = useStyles();
  return ( 
    <Paper className={classes.paper}>
      <div className={classes.root}>
        <Typography style={{ marginRight: 5 }} variant="h6" color="textSecondary">{id}</Typography>
        <Typography variant="h6" color="textSecondary">|</Typography>
        <Typography style={{ marginLeft: 5 }} variant="h6" color="textPrimary">{playerName}</Typography>
      </div>
      <div>
        <div className={classes.bar}/>
      </div>
    </Paper>
  )
}

export default PlayerCard;
