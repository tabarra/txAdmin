import React from "react";
import { Box, Grid, makeStyles, Theme, Typography } from "@material-ui/core";
import {usePageValue, txAdminMenuPage} from "../atoms/page.atom";
import PlayerCard from "./PlayerCard";

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
  }
}))

export const PlayersPage: React.FC = () => {
  const classes = useStyles()
  const page = usePageValue()

  const isCurrentPage = page === txAdminMenuPage.Players

  return isCurrentPage && (
    <Box className={classes.root} mt={2} mb={10} pt={4} pl={4}>
      <div>
        <Typography variant='h5' color="primary" className={classes.title}>ONLINE PLAYERS</Typography>
        <Typography className={classes.playerCount}>47/420 Players</Typography>
      </div>
      <Box pt={2}>
        <Grid container spacing={6}>
          <Grid item xs={2}>
            <PlayerCard id={1} playerName='chip'/>
          </Grid>
          <Grid item xs={2}>
            <PlayerCard id={1} playerName='chip'/>
          </Grid>
          <Grid item xs={2}>
            <PlayerCard id={1} playerName='chip'/>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}