import React, { useEffect, useState } from "react";
import {
  Box,
  InputAdornment,
  makeStyles,
  MenuItem,
  Theme,
  Typography,
} from "@material-ui/core";
import { Search, SortByAlpha } from "@material-ui/icons";
import {
  PlayerDataSort,
  usePlayersSortBy,
  usePlayersState,
  useSetPlayerFilter,
} from "../../state/players.state";
import { useDebounce } from "../../hooks/useDebouce";
import { useServerCtxValue } from "../../state/server.state";
import { useTranslate } from "react-polyglot";
import { TextField } from "../misc/TextField";

const useStyles = makeStyles((theme: Theme) => ({
  title: {
    fontWeight: 600,
  },
  playerCount: {
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  icon: {
    color: theme.palette.text.secondary,
  },
  inputs: {
    minWidth: 150,
  },
}));

export const PlayerPageHeader: React.FC = () => {
  const classes = useStyles();
  const [sortType, setSortType] = usePlayersSortBy();
  const setPlayerFilter = useSetPlayerFilter();
  const allPlayers = usePlayersState();
  const [searchVal, setSearchVal] = useState("");
  const serverCtx = useServerCtxValue();
  const t = useTranslate();

  const debouncedInput = useDebounce(searchVal, 500);

  // We might need to debounce this in the future
  const handleSortData = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSortType(e.target.value as PlayerDataSort);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
  };

  useEffect(() => {
    setPlayerFilter(debouncedInput as string);
  }, [debouncedInput, setPlayerFilter]);

  return (
    <Box display="flex" justifyContent="space-between">
      <Box px={2}>
        <Typography variant="h5" color="primary" className={classes.title}>
          {t("nui_menu.page_players.misc.online_players")}
        </Typography>
        <Typography className={classes.playerCount}>
          {`${allPlayers.length}/${serverCtx.maxClients} ${t('nui_menu.page_players.misc.players')} - ${
            serverCtx.oneSync.status ? `OneSync (${serverCtx.oneSync.type})` : `OneSync Off`}`}
        </Typography>
      </Box>
      <Box display="flex" alignItems="center" justifyContent="center">
        <TextField
          label={t("nui_menu.page_players.misc.search")}
          value={searchVal}
          onChange={handleSearchChange}
          className={classes.inputs}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" className={classes.icon}>
                <Search color="inherit" />
              </InputAdornment>
            ),
          }}
          style={{ marginRight: 20 }}
        />
        <TextField
          label={t("nui_menu.page_players.sort.label")}
          select
          className={classes.inputs}
          onChange={handleSortData}
          value={sortType}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" className={classes.icon}>
                <SortByAlpha color="inherit" />
              </InputAdornment>
            ),
          }}
        >
          <MenuItem value={PlayerDataSort.IdJoinedFirst}>
            {`${t("nui_menu.page_players.sort.id")} (${t(
              "nui_menu.page_players.sort.joined_first"
            )})`}
          </MenuItem>
          <MenuItem value={PlayerDataSort.IdJoinedLast}>
            {`${t("nui_menu.page_players.sort.id")} (${t(
              "nui_menu.page_players.sort.joined_last"
            )})`}
          </MenuItem>
          <MenuItem value={PlayerDataSort.DistanceClosest}>
            {`${t("nui_menu.page_players.sort.distance")} (${t(
              "nui_menu.page_players.sort.closest"
            )})`}
          </MenuItem>
          <MenuItem value={PlayerDataSort.DistanceFarthest}>
            {`${t("nui_menu.page_players.sort.distance")} (${t(
              "nui_menu.page_players.sort.farthest"
            )})`}
          </MenuItem>
        </TextField>
      </Box>
    </Box>
  );
};
