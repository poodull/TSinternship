// Guarantee TS namespace.
if (!window.TS) {
  window.TS = {};
}

!function($,TS) {

    TS.SignalViewer = function(args) {
        this.args = args;
        this.d3 = this.args.d3 || window.d3;
    }
    this.colors = this.args.colors || ["#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850"];
    this.reverseColors = this.colors.slice().reverse();
    this.activeColorSet = d3.scale.quantile().range(this.reverseColors);

}
  TS.SignalViewer.prototype = {};

  TS.SignalViewer.prototype.loadData = function(data) {
    if (typeof data == 'object') {
      // Load directly
      $.proxy(_loadData, this, data)();
    } else {
      // Assume it is a url
      this.d3.csv(data, $.proxy(_loadData, this));
    }
  };
