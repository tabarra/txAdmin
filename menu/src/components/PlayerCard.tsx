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
import { PlayerData } from "../state/players.state";

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    padding: 20,
    borderRadius: 10,
    minWidth: 250,
  },
  root: {
    display: "flex",
    alignItems: "center",
    paddingBottom: 5,
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
}));

const PlayerCard: React.FC<PlayerData> = ({
  id,
  username,
  health,
  vehicleStatus,
}) => {
  const classes = useStyles();

  const statusIcon = {
    walking: <DirectionsWalk color="inherit" />,
    driving: <DriveEta color="inherit" />,
    boat: <DirectionsBoat color="inherit" />,
    biking: <Motorcycle color="inherit" />,
  };

  const upperCaseStatus = vehicleStatus.charAt(0).toUpperCase() + vehicleStatus.slice(1)

  return (
    <Box p={2}>
      <Paper className={classes.paper}>
        <Box display="flex" alignItems="center" pb="5px">
          <Box flexGrow={1} display="flex">
            <Tooltip
              title={upperCaseStatus}
              placement="top"
            >
              <span className={classes.icon}>{statusIcon[vehicleStatus]}</span>
            </Tooltip>
            <Typography
              style={{ marginRight: 5 }}
              variant="subtitle1"
              color="textSecondary"
            >
              {id}
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
              {username}
            </Typography>
          </Box>
          <IconButton>{<MoreVert />}</IconButton>
        </Box>
        <div>
          <Tooltip title={`${health}% health`} placement="bottom" arrow>
            <div className={classes.barBackground}>
              <Box className={classes.barInner} width={`${health}%`} />
            </div>
          </Tooltip>
        </div>
      </Paper>
    </Box>
  );
};

export default memo(PlayerCard);
