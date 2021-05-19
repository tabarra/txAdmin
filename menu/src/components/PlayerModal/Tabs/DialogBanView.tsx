import React, { useState } from "react";
import { Box, Button, DialogContent, DialogContentText, MenuItem, TextField } from "@material-ui/core";
import { usePlayerDetails } from "../../../state/players.state";

const DialogBanView: React.FC = () => {
  const player = usePlayerDetails();

  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('2 hours');
  const [customDuration, setCustomDuration] = useState('hours')
  const [customDurLength, setCustomDurLength] = useState('1');

  const handleBan = async () => {
    const actualDuration = duration === 'custom' ? `${customDurLength} ${customDuration}` : duration;
    const res = await fetch('player/ban', {
      method: 'POST',
      body: JSON.stringify({ reason, actualDuration, reference: player.id })
    })
  }

  return (
    <DialogContent>
      <DialogContentText>Ban Player</DialogContentText>
      <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Reason"
        required
        type="text"
        variant="outlined"
        multiline
        rows={2}
        rowsMax={2}
        fullWidth
        value={reason}
        onChange={(e) => setReason(e.currentTarget.value)}
      />
      <TextField
        autoFocus
        margin="dense"
        select
        label="Duration"
        variant="outlined"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        helperText="Please select an duration"
        fullWidth
      >
        {banDurations.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      {duration === 'custom' && (
        <Box display="flex" alignItems="center" justifyContent="center">
          <Box>
            <TextField
              type="number"
              placeholder="1"
              variant="outlined"
              margin="dense"
              value={customDurLength}
              onChange={(e) => setCustomDurLength(e.target.value)}
            />
          </Box>
          <Box flexGrow={1}>
            <TextField
              select
              variant="outlined"
              margin="dense"
              fullWidth
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
            >
              {customBanLength.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      )}
      <Button variant="contained" color="primary" style={{ marginTop: 2 }} onClick={handleBan}>Ban</Button>
    </DialogContent>
  )
}

const banDurations = [
  {
    value: '2 hours',
    label: '2 hours'
  },
  {
    value: '8 hours',
    label: '8 hours'
  },
  {
    value: '1 day',
    label: '1 day'
  },
  {
    value: '2 days',
    label: '2 days'
  },
  {
    value: '1 week',
    label: '1 week'
  },
  {
    value: '2 weeks',
    label: '2 weeks'
  },
  {
    value: 'perma',
    label: 'Permanent'
  },
  {
    value: 'custom',
    label: 'Custom'
  }
]

const customBanLength = [
  {
    value: 'hours',
    label: 'Hours'
  },
  {
    value: 'days',
    label: 'Days'
  },
  {
    value: 'weeks',
    label: 'Week'
  },
  {
    value: 'months',
    label: 'Months'
  }
]

export default DialogBanView;