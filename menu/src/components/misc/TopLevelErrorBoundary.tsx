import React, { Component } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { fetchNui } from "../../utils/fetchNui";

interface ErrorCompState {
  hasError: boolean;
  error: Error | null;
}

export class TopLevelErrorBoundary extends Component<any, ErrorCompState> {
  state = {
    hasError: false,
    error: null,
  };

  constructor(props) {
    super(props);
    this.handleReloadClick.bind(this);
  }

  componentDidUpdate() {
    if (this.state.hasError) fetchNui("focusInputs", true);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReloadClick() {
    fetchNui("focusInputs", false);
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <Dialog open={this.state.hasError}>
          <DialogTitle>Fatal Error Encountered</DialogTitle>
          <DialogContent>
            <DialogContentText>
              The txAdmin menu has an encountered an error it was unable to
              recover from, the NUI frame will need to be reloaded. The error
              message is shown below for developer reference.
              <br />
              <br />
              <code style={{ color: "red" }}>{this.state.error.message}</code>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button color="primary" onClick={this.handleReloadClick}>
              Reload Menu
            </Button>
          </DialogActions>
        </Dialog>
      );
    }

    return this.props.children;
  }
}
