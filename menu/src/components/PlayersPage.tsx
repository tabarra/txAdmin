import React, {useEffect, useState} from "react";
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
    alignItems: "center",
    flexGrow: 1,
    overflow: "auto",
  },
}));

export const PlayersPage: React.FC<{ visible: boolean }> = ({ visible }) => {
  const classes = useStyles();
  const players = useFilteredSortedPlayers();
  const [playerAmountRender, setPlayerAmountRender] = useState(50);
  const [loading, setLoading] = useState(false);

  const slicedPlayers = players.slice(0, playerAmountRender);

  useEffect(() => {
    setPlayerAmountRender(40)
  }, [players])

  const handleNextLoad = () => {
    setLoading(true);
    setTimeout(() => {
      if (playerAmountRender + 40 > players.length) {
        const max = players.length - playerAmountRender
        setPlayerAmountRender(max)
        setLoading(false);
        return
      }
      setPlayerAmountRender(playerAmountRender + 40)
      setLoading(false);
    }, 1000);
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
            hasMore={true}
            dataLength={playerAmountRender}
            scrollableTarget="playerGrid"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              flexGrow: 1,
            }}
            loader={<div/>}
          >
            {slicedPlayers.map((player) => (
              <PlayerCard {...player} key={player.id} />
            ))}
          </InfiniteScroll>
          <Box
            visibility={loading ? 'visible' : 'hidden'}
            id='grid-loader'
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
