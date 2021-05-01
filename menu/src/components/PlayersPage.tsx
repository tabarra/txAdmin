import React, { useState } from "react";
import { Box, CircularProgress, makeStyles, Theme } from "@material-ui/core";
import PlayerCard from "./PlayerCard";
import { PlayerPageHeader } from "./PlayerPageHeader";
import { useFilteredSortedPlayers } from "../state/players.state";
import InfiniteScroll from "react-infinite-scroll-component";

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
  const [playerAmountRender, setPlayerAmountRender] = useState(40);
  const [loading, setLoading] = useState(false);
  const slicedPlayers = players.slice(0, playerAmountRender);

  const handleNextLoad = () => {
    setLoading(true);
    setTimeout(() => {
      if (playerAmountRender + 40 > players.length && players.length > 40) {
        const max = players.length - playerAmountRender;
        setLoading(false);
        setPlayerAmountRender(max);
        return;
      }
      setLoading(false);
      setPlayerAmountRender(playerAmountRender + 40);
    }, 500);
  };

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
      <Box className={classes.grid} pt={2}>
        <Box py={2} className={classes.playerGrid} id="playerGrid">
          <InfiniteScroll
            next={handleNextLoad}
            hasMore={playerAmountRender === players.length}
            dataLength={playerAmountRender}
            scrollableTarget="playerGrid"
            style={{
              display: "flex",
              flexWrap: "wrap",
              flexGrow: 1,
            }}
            loader={<div />}
          >
            {slicedPlayers.map((player) => (
              <PlayerCard {...player} key={player.id} />
            ))}
          </InfiniteScroll>
          <Box
            visibility={loading ? "visible" : "hidden"}
            id="grid-loader"
            width="100%"
            display="flex"
            justifyContent="center"
          >
            <CircularProgress />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
