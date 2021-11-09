import React, { useEffect } from "react";
import { Box, Theme } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { PlayerPageHeader } from "./PlayerPageHeader";
import { useFilteredSortedPlayers } from "../../state/players.state";
import { PlayersListEmpty } from "./PlayersListEmpty";
import { PlayersListGrid } from "./PlayersListGrid";
import { usePlayerListListener } from "../../hooks/usePlayerListListener";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    height: "50vh",
    borderRadius: 15,
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
    display: "flex",
    flexDirection: "column",
    height: "85%",
  },
  playerGrid: {
    display: "flex",
    flexWrap: "wrap",
    flexGrow: 1,
    overflowX: "hidden",
    overflowY: "auto",
  },
}));

export const PlayersPage: React.FC<{ visible: boolean }> = ({ visible }) => {
  const classes = useStyles();
  const players = useFilteredSortedPlayers();

  usePlayerListListener();

  return (
    <Box
      className={classes.root}
      mt={2}
      mb={10}
      pt={4}
      px={4}
      display={visible ? "initial" : "none"}
    >
      <PlayerPageHeader />
      <Box className={classes.grid}>
        {players.length ? <PlayersListGrid /> : <PlayersListEmpty />}
      </Box>
    </Box>
  );
};
