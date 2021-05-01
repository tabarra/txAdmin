import React from "react";
import { Box, makeStyles, Theme } from "@material-ui/core";
import PlayerCard from "./PlayerCard";
import { PlayerPageHeader } from "./PlayerPageHeader";
import { useFilteredSortedPlayers } from "../state/players.state";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    height: '50vh',
    borderRadius: 15,
    displayFlex: "column",
    flex: 1,
  },
  overrideWrapper: {
    display: "flex",
  },
  title: {
    fontWeight: 600,
  },
  playerCount: {
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    height: '80%'
  },
  playerGrid: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    flexGrow: 1,
    overflow: 'auto',
  },
}));

export const PlayersPage: React.FC<{ visible: boolean }> = ({ visible }) => {
  const classes = useStyles();
  const players = useFilteredSortedPlayers();
  const optimizedPlayers = players.slice(0, 300)
  const hasMorePlayers = (players.length > optimizedPlayers.length)
  return (
    <Box
      className={classes.root}
      mt={2}
      mb={10}
      pt={4}
      px={4}
      visibility={visible ? "visible" : "hidden"}
    >
      <PlayerPageHeader />
      <div className={classes.grid}>
        <Box py={2} className={classes.playerGrid}>
          {optimizedPlayers.map((player) => (
            <PlayerCard {...player} key={player.id} />
          ))}
          {hasMorePlayers && <p>yo there's more</p>}
        </Box>
      </div>
    </Box>
  );
};
