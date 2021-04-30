import React from "react";
import { Box, Grid, makeStyles, TextField, Theme, Typography } from "@material-ui/core";
import {usePageValue, txAdminMenuPage} from "../atoms/page.atom";
import PlayerCard from "./PlayerCard";
import {DirectionsWalk, DriveEta, DirectionsBoat, Motorcycle } from '@material-ui/icons';
import { stat } from "node:fs";
import { PlayerPageHeader } from "./PlayerPageHeader";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    flexGrow: 1,
    borderRadius: 15,
  },
  overrideWrapper: {
    display: 'flex'
  },
  title: {
    fontWeight: 600
  },
  playerCount: {
    color: '#808384',
    fontWeight: 500
  },
  gridItem: {
    minWidth: 200,
    maxWidth: 500
  }
}))

export const PlayersPage: React.FC = () => {
  const classes = useStyles()
  const page = usePageValue()

  const statusIcon = {
    walking: <DirectionsWalk color="inherit" />,
    driving: <DriveEta color="inherit"  />,
    boat: <DirectionsBoat color="inherit" />,
    biking: <Motorcycle color="inherit" />
  }

  const isCurrentPage = page === txAdminMenuPage.Players

  return isCurrentPage && (
    <Box className={classes.root} mt={2} mb={10} pt={4} px={4}>
      <PlayerPageHeader />
      <Box pt={2}>
        <Grid container spacing={2}>
          <Grid item xs={2} className={classes.gridItem}>
            <PlayerCard id={1000} playerName='Hubert Blaine Wolfeschlegelsteinhausenbergerdorff Sr.' icon={statusIcon['walking']} />
          </Grid>
          <Grid item xs={2}>
            <PlayerCard id={1} playerName='Hubert Blaine Wolfeschlegelsteinhausenbergerdorff Sr.' icon={statusIcon['boat']}/>
          </Grid>
          <Grid item xs={2}>
            <PlayerCard id={1} playerName='Hubert Blaine Wolfeschlegelsteinhausenbergerdorff ' icon={statusIcon['biking']}/>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}