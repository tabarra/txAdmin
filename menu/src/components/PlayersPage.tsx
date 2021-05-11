import React from "react";
import { Box, makeStyles, Theme } from "@material-ui/core";
import { PlayerPageHeader } from "./PlayerPageHeader";
import { useFilteredSortedPlayers } from "../state/players.state";
import { PlayersListEmpty } from "./PlayersListEmpty";
import { PlayersListGrid } from "./PlayersListGrid";
import PlayerModal from "./PlayerModal";
import PlayerProvider from "../provider/PlayerProvider";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    height: "50vh",
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
    display: "flex",
    flexDirection: "column",
    height: "85%",
  },
  playerGrid: {
    display: "flex",
    flexWrap: "wrap",
    flexGrow: 1,
    overflow: "auto",
  },
}));

export const PlayersPage: React.FC<{ visible: boolean }> = ({ visible }) => {
  const classes = useStyles();
  const players = useFilteredSortedPlayers();

  return (
    <PlayerProvider>
      <Box
        className={classes.root}
        mt={2}
        mb={10}
        pt={4}
        px={4}
        visibility={visible ? "visible" : "hidden"}
      >
        <PlayerPageHeader />
        <PlayerModal />
        <Box className={classes.grid}>
          {players.length ? <PlayersListGrid /> : <PlayersListEmpty />}
        </Box>
      </Box>
    </PlayerProvider>
  );
};
