import React, { memo, useEffect, useRef, useState } from "react";
import {
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
  Theme,
} from "@material-ui/core";
import { useSetTabState } from "../state/tab.state";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import { Code } from "@material-ui/icons";

export interface MenuListItemProps {
  icon: JSX.Element;
  primary: string;
  secondary: string;
  onSelect: () => void;
  selected: boolean;
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

export const MenuListItem: React.FC<MenuListItemProps> = memo(
  ({ icon, primary, onSelect, secondary, selected }) => {
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
  }
);

interface MenuListItemMultiAction {
  label: string;
  value: string | number | boolean;
}

export interface MenuListItemMultiProps {
  actions: MenuListItemMultiAction[];
  onChange: (newItem: MenuListItemMultiAction) => void;
  initialValue?: MenuListItemMultiAction;
  selected: boolean;
  primary: string;
  icon: JSX.Element;
}

export const MenuListItemMulti: React.FC<MenuListItemMultiProps> = memo(
  ({ selected, primary, actions, onChange, icon, initialValue }) => {
    const classes = useStyles();
    const setTabState = useSetTabState();
    const [curState, setCurState] = useState(0);

    const compMounted = useRef(false);

    useEffect(() => {
      if (selected) setTabState(true);
      else setTabState(false);
    }, [selected]);

    // Mount/unmount detection
    // We will only run this hook after initial mount
    // and not on unmount.
    // NOTE: This hook does not work if actions prop are dynamic
    useEffect(() => {
      if (compMounted.current) {
        onChange(actions[curState]);
      } else {
        compMounted.current = true;
        // We will set the initial value of the item based on the passed initial value
        const index = actions.findIndex((a) => a.value === initialValue?.value);
        setCurState(index > -1 ? index : 0);
      }
    }, [curState]);

    const handleLeftArrow = () => {
      if (!selected) return;
      const nextEstimatedItem = curState - 1;
      const nextItem =
        nextEstimatedItem < 0 ? actions.length - 1 : nextEstimatedItem;
      setCurState(nextItem);
    };

    const handleRightArrow = () => {
      if (!selected) return;
      const nextEstimatedItem = curState + 1;
      const nextItem =
        nextEstimatedItem >= actions.length ? 0 : nextEstimatedItem;
      setCurState(nextItem);
    };

    useKeyboardNavigation({
      onRightDown: handleRightArrow,
      onLeftDown: handleLeftArrow,
      disableOnFocused: true
    });

    return (
      <ListItem className={classes.root} dense selected={selected}>
        <ListItemIcon className={classes.icon}>{icon}</ListItemIcon>
        <ListItemText
          primary={primary}
          secondary={`Current: ${actions[curState]?.label || "Unknown"}`}
          classes={{
            primary: classes.overrideText,
          }}
        />
        <ListItemSecondaryAction>
          <Code className={classes.icon} />
        </ListItemSecondaryAction>
      </ListItem>
    );
  }
);
