import React from "react";
import ReactIntl from "react-intl";

import A from "./link.jsx";
import Player from "./nav-player.jsx";

const IntlMixin = ReactIntl.IntlMixin;

export default React.createClass({
  mixins: [IntlMixin],
  isActive: function(route) {
    return this.props.route === route ? "active" : "";
  },
  render: function() {
    const src = this.props.src;
    const nowPlaying = this.props.nowPlaying;
    const isPlaying = this.props.isPlaying;
    const isOpen = this.props.paneIsOpen;
    const playBus = this.props.playBus;
    const navClass = isOpen ? "app-nav-open" : "app-nav-close";

    const player = !this.props.playerOnBottom ? (
      <Player src={src} nowPlaying={nowPlaying} isPlaying={isPlaying} playBus={playBus} />
    ) : "";

    return (
      <nav className={"app-nav " + navClass}>
        <ul>
          <li className={this.isActive("radio")}>
            <A href="/">{this.getIntlMessage("fip-radio")}</A>
          </li>
          <li className={this.isActive("favorites")}>
            <A href="/users/me/songs">{this.getIntlMessage("favorites")}</A>
          </li>
        </ul>
        {player}
      </nav>
    );
  }
});
