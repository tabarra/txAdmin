import React, { memo } from "react";
import { Box, IconButton, Paper, Theme, Tooltip, Typography } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import {
  DirectionsBoat,
  DirectionsWalk,
  DriveEta,
  LiveHelp,
  MoreVert,
  BikeScooter,
  Flight
} from "@mui/icons-material";
import { usePlayerModalContext } from "../../provider/PlayerModalProvider";
import { PlayerData, VehicleStatus } from "../../state/players.state";
import { useSetAssociatedPlayer } from "../../state/playerDetails.state";
import { formatDistance } from "../../utils/miscUtils";
import { useTranslate } from 'react-polyglot';

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    padding: 20,
    borderRadius: 10,
  },
  barBackground: {
    background: theme.palette.primary.dark,
    height: 5,
    borderRadius: 10,
    overflow: "hidden",
  },
  barInner: {
    height: "100%",
    background: theme.palette.primary.main,
  },
  icon: {
    paddingRight: 7,
    color: theme.palette.primary.main,
  },
  tooltipOverride: {
    fontSize: 12,
  },
}));

const PlayerCard: React.FC<{ playerData: PlayerData }> = ({ playerData }) => {
  const classes = useStyles();
  const { setModalOpen } = usePlayerModalContext();
  const setAssociatedPlayer = useSetAssociatedPlayer();
  const t = useTranslate()

  const statusIcon: { [K in VehicleStatus]: JSX.Element } = {
    unknown: <LiveHelp color="inherit" />,
    walking: <DirectionsWalk color="inherit" />,
    driving: <DriveEta color="inherit" />,
    boating: <DirectionsBoat color="inherit" />,
    biking: <BikeScooter color="inherit" />,
    flying: <Flight color="inherit" />,
  };

  const handlePlayerClick = () => {
    setModalOpen(true);
    setAssociatedPlayer(playerData);
  };

  const upperCaseStatus =
    playerData.vehicleStatus.charAt(0).toUpperCase() +
    playerData.vehicleStatus.slice(1);

  return (
    <Box p={2}>
      <Paper className={classes.paper}>
        <Box display="flex" alignItems="center" pb="5px">
          <Box flexGrow={1} display="flex" overflow="hidden">
            <Tooltip
              title={upperCaseStatus}
              placement="top"
              arrow
              classes={{
                tooltip: classes.tooltipOverride,
              }}
            >
              <span className={classes.icon}>
                {statusIcon[playerData.vehicleStatus]}
              </span>
            </Tooltip>
            <Typography
              style={{ marginRight: 5 }}
              variant="subtitle1"
              color="textSecondary"
            >
              {playerData.id}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              |
            </Typography>
            <Tooltip
              title={playerData.username}
              placement="top"
              arrow
              classes={{
                tooltip: classes.tooltipOverride,
              }}
            >
              <Typography
                style={{ marginLeft: 5 }}
                noWrap
                variant="subtitle1"
                color="textPrimary"
              >
                {playerData.username}
              </Typography>
            </Tooltip>
            <Typography
              style={{ marginLeft: 7, minWidth: "fit-content" }}
              noWrap
              variant="subtitle1"
              color="textSecondary"
            >
              {playerData.distance < 0
                ? `?? m`
                : formatDistance(playerData.distance)}
            </Typography>
          </Box>
          <IconButton onClick={handlePlayerClick} size="large">{<MoreVert />}</IconButton>
        </Box>
        <div>
          <Tooltip
            title={t('nui_menu.page_players.card.health', { percentHealth: playerData.health})}
            placement="bottom"
            arrow
            classes={{
              tooltip: classes.tooltipOverride,
            }}
          >
            <div className={classes.barBackground}>
              <Box
                className={classes.barInner}
                width={`${playerData.health}%`}
              />
            </div>
          </Tooltip>
        </div>
      </Paper>
    </Box>
  );
};

export default memo(PlayerCard);
