import React from "react";
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  Theme,
} from "@material-ui/core";

interface MenuListItemProps extends MenuListItemData {
  selected: boolean;
}

export interface MenuListItemData {
  icon: JSX.Element;
  primary: string;
  secondary: string;
  onSelect: () => void;
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    borderRadius: 15,
  },
  icon: {
    color: theme.palette.text.secondary,
  },
  overrideText: {
    color: theme.palette.text.primary,
    fontSize: 16,
  },
}));

export const MenuListItem: React.FC<MenuListItemProps> = ({
  icon,
  primary,
  onSelect,
  secondary,
  selected,
}) => {
  const classes = useStyles();

  return (
    <ListItem
      onClick={() => onSelect()}
      className={classes.root}
      dense
      selected={selected}
    >
      <ListItemIcon className={classes.icon}>{icon}</ListItemIcon>
      <ListItemText
        primary={primary}
        secondary={secondary}
        classes={{
          primary: classes.overrideText,
        }}
      />
    </ListItem>
  );
};
