import React, { memo } from "react";
import {
  Box,
  IconButton,
  makeStyles,
  Paper,
  Theme,
  Tooltip,
  Typography,
} from "@material-ui/core";
import {
  DirectionsBoat,
  DirectionsWalk,
  DriveEta,
  MoreVert,
  Motorcycle,
} from "@material-ui/icons";
import { usePlayerModalContext } from '../../provider/PlayerModalProvider';
import { PlayerData, VehicleStatus } from "../../state/players.state";
import { useSetAssociatedPlayer } from '../../state/playerDetails.state';

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
    fontSize: 12
  }
}));

const PlayerCard: React.FC<{playerData: PlayerData}> = ({playerData}) => {
  const classes = useStyles();
  const { setModalOpen } = usePlayerModalContext();
  const setAssociatedPlayer = useSetAssociatedPlayer();

  const statusIcon: { [K in VehicleStatus]: JSX.Element } = {
    walking: <DirectionsWalk color="inherit" />,
    driving: <DriveEta color="inherit" />,
    boating: <DirectionsBoat color="inherit" />,
    biking: <Motorcycle color="inherit" />,
  };

  const handlePlayerClick = () => {
    setModalOpen(true);
    setAssociatedPlayer(playerData)
  };

  const upperCaseStatus =
    playerData.vehicleStatus.charAt(0).toUpperCase() + playerData.vehicleStatus.slice(1);

  return (
    <Box p={2}>
      <Paper className={classes.paper}>
        <Box display="flex" alignItems="center" pb="5px">
          <Box flexGrow={1} display="flex">
            <Tooltip
              title={upperCaseStatus}
              placement="top"
              arrow
              classes={{
                tooltip: classes.tooltipOverride,
              }}
            >
              <span className={classes.icon}>{statusIcon[playerData.vehicleStatus]}</span>
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
            <Typography
              style={{ marginLeft: 5 }}
              noWrap
              variant="subtitle1"
              color="textPrimary"
            >
              {playerData.username}
            </Typography>
          </Box>
          <IconButton onClick={handlePlayerClick}>{<MoreVert />}</IconButton>
        </Box>
        <div>
          <Tooltip
            title={`${playerData.health}% health`}
            placement="bottom"
            arrow
            classes={{
              tooltip: classes.tooltipOverride,
            }}
          >
            <div className={classes.barBackground}>
              <Box className={classes.barInner} width={`${playerData.health}%`} />
            </div>
          </Tooltip>
        </div>
      </Paper>
    </Box>
  );
};

export default memo(PlayerCard);
