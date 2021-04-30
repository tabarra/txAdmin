import React from "react";
import { Box, makeStyles, Theme } from "@material-ui/core";
import { usePageValue, txAdminMenuPage } from "../state/page.state";
import PlayerCard from "./PlayerCard";
import { PlayerPageHeader } from "./PlayerPageHeader";
import {useFilteredSortedPlayers} from "../state/players.state";

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
    color: theme.palette.text.secondary,
    fontWeight: 500
  },
}))

export const PlayersPage: React.FC = () => {
  const classes = useStyles()
  const page = usePageValue()
  const players = useFilteredSortedPlayers()

  const isCurrentPage = page === txAdminMenuPage.Players

  return isCurrentPage && (
    <Box className={classes.root} mt={2} mb={10} pt={4} px={4}>
      <PlayerPageHeader />
        <Box py={2} display='flex' flexWrap='wrap' alignItems='center' overflow='auto'>
          {players.map((player) => <PlayerCard {...player} key={player.id}/>)}
        </Box>
    </Box>
  )
}