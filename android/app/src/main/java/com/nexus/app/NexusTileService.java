package com.nexus.app;

import android.content.Intent;
import android.graphics.drawable.Icon;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

/**
 * NEXUS AI — Quick Settings Tile Service
 *
 * Allows users to toggle their primary smart device or trigger scenes directly
 * from the Android notification pull-down drawer without opening the full app.
 *
 * 100% local, zero server cost, zero cloud latency.
 */
public class NexusTileService extends TileService {

    @Override
    public void onStartListening() {
        super.onStartListening();
        Tile tile = getQsTile();
        if (tile != null) {
            tile.setLabel("NEXUS");
            if (tile.getState() == Tile.STATE_UNAVAILABLE) {
                tile.setState(Tile.STATE_INACTIVE);
            }
            tile.updateTile();
        }
    }

    @Override
    public void onClick() {
        super.onClick();
        Tile tile = getQsTile();
        if (tile == null) return;

        // Toggle state locally
        int newState = (tile.getState() == Tile.STATE_ACTIVE) ? Tile.STATE_INACTIVE : Tile.STATE_ACTIVE;
        tile.setState(newState);
        tile.updateTile();

        // Launch app or send intent to process action
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launchIntent.putExtra("nexus_action", "quick_tile_toggle");
        startActivityAndCollapse(launchIntent);
    }
}
