import { IconButton, makeStyles, Paper, Theme, Typography } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import React from 'react'

interface PlayerData {
  id: number;
  playerName: string;
  icon: JSX.Element;
  health?: number;
  armour?: number;
}

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    padding: 20,
    borderRadius: 10,
  },
  root: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: 5
  },
  bar: {
    background: theme.palette.primary.main,
    width: '100%',
    height: '5px',
    borderRadius: 10,
  },
  icon: {
    paddingRight: 7,
    color: theme.palette.primary.main
  }
}))

const PlayerCard: React.FC<PlayerData> = ({ id, playerName, icon, health, armour }) => {
  const classes = useStyles();
  return ( 
    <Paper className={classes.paper}>
      <div className={classes.root}>
        <span className={classes.icon}>{icon}</span>
        <Typography style={{ marginRight: 5 }} variant="h6" color="textSecondary">{id}</Typography>
        <Typography variant="h6" color="textSecondary">|</Typography>
        <Typography style={{ marginLeft: 5 }} noWrap variant="h6" color="textPrimary">{playerName}</Typography>
        <IconButton>{<MoreVert />}</IconButton>
      </div>
      <div>
        <div className={classes.bar}/>
      </div>
    </Paper>
  )
}

export default PlayerCard;
