// (It's CSV, but GitHub Pages only gzip's JSON at the moment.)
function filterCharts(csv)
{
    d3.csv("resources/data/T2signals.csv", function (error, signals) {

        // Various formatters.
        var formatNumber = d3.format(",d"),
            formatChange = d3.format("+,d"),
            formatDate = d3.time.format("%B %d, %Y"),
            formatTime = d3.time.format("%I:%M:%S %p");

        // A nest operator, for grouping the signal list.
        var nestByDate = d3.nest()
            .key(function (d) {
                return d3.time.day(d.date);
            });

        // A little coercion, since the CSV is untyped.
        signals.forEach(function (d, i) {
            d.index = i;
            d.date = parseDate(d.TIMESTAMP);
            d.bw = +d.BW;
            d.freq = +((d.FREQ / 100000)).toFixed(1); //convert to mhz, round to 1 decimal
            d.amp = +d.AMP;
            d.tcode = +d.TCODE;
            d.txid = +d.TXID;
            d.devcnt = +d.DEVCNT;
        });
        console.log(signals);
        // Create the crossfilter for the relevant dimensions and groups.
        var signal = crossfilter(signals),
            all = signal.groupAll(),
            date = signal.dimension(function (d) {
                return d.date;
            }),
            dates = date.group(d3.time.day),
            timecode = signal.dimension(function (d) {
                return d.tcode;
            }),
            timecodes = timecode.group(function (d) {
                return Math.floor(d / 10) * 10;
            }),
            frequency = signal.dimension(function (d) {
                return d.freq;
            }),
        //frequencies = frequency.group(Math.floor),
            frequencies = frequency.group(function (d) {
                return Math.floor(d);// 5) * 5;
            }),
            bandwidth = signal.dimension(function (d) {
                return d.bw;
            }),
            bandwidths = bandwidth.group(function (d) {
                return Math.floor(d);// 5) * 5;
            }),
            amplitude = signal.dimension(function (d) {
                return d.amp;
            }),
            amplitudes = amplitude.group(function (d) {
                return Math.floor(d / 50) * 50;
            });
        var ampMax = d3.max(signals, function (d) {
            return d.amp;
        });
        var ampMin = d3.min(signals, function (d) {
            return d.amp;
        });
        var freqMax = d3.max(signals, function (d) {
            return d.freq;
        });
        var freqMin = d3.min(signals, function (d) {
            return d.freq;
        });
        var bwMax = d3.max(signals, function (d) {
            return d.bw;
        });
        var bwMin = d3.min(signals, function (d) {
            return d.bw;
        });
        var tcMax = d3.max(signals, function (d) {
            return d.tcode;
        });
        var tcMin = d3.min(signals, function (d) {
            return d.tcode;
        });
        //Increase the range because the values at the end are
        freqMax += 200;
        bwMax += 2000;
        tcMax += 10;
        var charts = [
            barChart()
                .dimension(frequency)
                .group(frequencies)
                .x(d3.scale.linear()
                    .domain([freqMin, freqMax])
                    .rangeRound([0, 2 * 130])),
            // .ticks(5),
            //.map(x.tickFormat(5, "+%")),

            barChart()
                .dimension(bandwidth)
                .group(bandwidths)
                .x(d3.scale.linear()
                    .domain([bwMin, bwMax])
                    .rangeRound([0, 10 * 30])),

            barChart()
                .dimension(amplitude)
                .group(amplitudes)
                .x(d3.scale.linear()
                    .domain([ampMin, ampMax])
                    .rangeRound([0, 10 * 25])),

            barChart()
                .dimension(timecode)
                .group(timecodes)
                .x(d3.scale.linear()
                    .domain([tcMin, tcMax])
                    .rangeRound([0, 100 * 8]))


            /*      barChart()
             .dimension(date)
             .group(dates)
             .round(d3.time.day.round)
             .x(d3.time.scale()
             .domain([new Date(2015, 0, 1), new Date(2016, 0, 1)])
             .rangeRound([0, 10 * 90]))
             .filter([new Date(2015, 0, 1), new Date(2016, 0, 1)])

             */
        ];

        // Given our array of charts, which we assume are in the same order as the
        // .chart elements in the DOM, bind the charts to the DOM and render them.
        // We also listen to the chart's brush events to update the display.
        var chart = d3.selectAll(".chart")
            .data(charts)
            .each(function (chart) {
                chart.on("brush", renderAll).on("brushend", renderAll);
            });

        // Render the initial lists.
        var list = d3.selectAll(".list")
            .data([signalList]);
        // Render the total.
        d3.selectAll("#total")
            .text(formatNumber(signal.size()));

        renderAll();

        // Renders the specified chart or list.
        function render(method) {
            d3.select(this).call(method);
        }

        // Whenever the brush moves, re-rendering everything.
        function renderAll() {
            chart.each(render);
            list.each(render);
            d3.select("#active").text(formatNumber(all.value()));
        }

        // Like d3.time.format, but faster.
        function parseDate(d) {
            return new Date(d.substring(0, 4),
                d.substring(5, 7) - 1,
                d.substring(8, 10),
                d.substring(11, 13),
                d.substring(14, 16),
                d.substring(17, 19)
            );
        }

        window.filter = function (filters) {
            filters.forEach(function (d, i) {
                charts[i].filter(d);
            });
            renderAll();
        };

        window.reset = function (i) {
            charts[i].filter(null);
            renderAll();
        };

        function signalList(div) {
            var signalsByDate = nestByDate.entries(timecode.bottom(50));
            selected = timecode.bottom(Infinity);

            div.each(function () {
                var date = d3.select(this).selectAll(".date")
                    .data(signalsByDate, function (d) {
                        return d.key;
                    });


                date.enter().append("div")
                    .attr("class", "date")
                    .append("div")
                    .attr("class", "day");
                /*       .text(function (d) {
                 return formatDate(d.values[0].date);
                 });*/

                date.exit().remove();

                var signal = date.order().selectAll(".signal")
                    .data(function (d) {
                        return d.values;
                    }, function (d) {
                        return d.index;
                    });

                var signalEnter = signal.enter().append("div")
                    .attr("class", "signal");

                signalEnter.append("div")
                    .attr("class", "time")
                    .text(function (d) {
                        return formatTime(d.date);
                    });

                signalEnter.append("div")
                    .attr("class", "TXID")
                    .text(function (d) {
                        return d.txid;
                    });

                signalEnter.append("div")
                    .attr("class", "FREQUENCY")
                    .text(function (d) {
                        return d.freq;
                    });
                signalEnter.append("div")
                    .attr("class", "BANDWIDTH")
                    .text(function (d) {
                        return d.bw;
                    });
                signalEnter.append("div")
                    .attr("class", "AMPLITUDE")
                    .text(function (d) {
                        return d.amp;
                    });
                signalEnter.append("div")
                    .attr("class", "DEVICECOUNT")
                    .text(function (d) {
                        return d.devcnt;
                    });
                signalEnter.append("div")
                    .attr("class", "TCODE")
                    .text(function (d) {
                        return d.tcode;
                    });
                signal.exit().remove();

                signal.order();
            });
        }

        function barChart() {
            if (!barChart.id) barChart.id = 0;

            var margin = {top: 10, right: 10, bottom: 20, left: 10},
                x,
                y = d3.scale.linear().range([100, 0]),
                id = barChart.id++,
                axis = d3.svg.axis().orient("bottom"),
                brush = d3.svg.brush(),
                brushDirty,
                dimension,
                group,
                round;

            function chart(div) {
                var width = x.range()[1],
                    height = y.range()[0];

                y.domain([0, group.top(1)[0].value]);

                div.each(function () {
                    var div = d3.select(this),
                        g = div.select("g");

                    // Create the skeletal chart.
                    if (g.empty()) {
                        div.select(".title").append("a")
                            .attr("href", "javascript:reset(" + id + ")")
                            .attr("class", "reset")
                            .text("reset")
                            .style("display", "none");

                        g = div.append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom)
                            .append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        g.append("clipPath")
                            .attr("id", "clip-" + id)
                            .append("rect")
                            .attr("width", width)
                            .attr("height", height);

                        g.selectAll(".bar")
                            .data(["background", "foreground"])
                            .enter().append("path")
                            .attr("class", function (d) {
                                return d + " bar";
                            })
                            .datum(group.all());

                        g.selectAll(".foreground.bar")
                            .attr("clip-path", "url(#clip-" + id + ")");

                        g.append("g")
                            .attr("class", "axis")
                            .attr("transform", "translate(0," + height + ")")
                            .call(axis);

                        // Initialize the brush component with pretty resize handles.
                        var gBrush = g.append("g").attr("class", "brush").call(brush);
                        gBrush.selectAll("rect").attr("height", height);
                        gBrush.selectAll(".resize").append("path").attr("d", resizePath);
                    }

                    // Only redraw the brush if set externally.
                    if (brushDirty) {
                        brushDirty = false;
                        g.selectAll(".brush").call(brush);
                        div.select(".title a").style("display", brush.empty() ? "none" : null);
                        if (brush.empty()) {
                            g.selectAll("#clip-" + id + " rect")
                                .attr("x", 0)
                                .attr("width", width);
                        } else {
                            var extent = brush.extent();
                            g.selectAll("#clip-" + id + " rect")
                                .attr("x", x(extent[0]))
                                .attr("width", x(extent[1]) - x(extent[0]));
                        }
                    }

                    g.selectAll(".bar").attr("d", barPath);
                });

                function barPath(groups) {
                    var path = [],
                        i = -1,
                        n = groups.length,
                        d;
                    while (++i < n) {
                        d = groups[i];
                        path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
                    }
                    return path.join("");
                }

                function resizePath(d) {
                    var e = +(d == "e"),
                        x = e ? 1 : -1,
                        y = height / 3;
                    return "M" + (.5 * x) + "," + y
                        + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
                        + "V" + (2 * y - 6)
                        + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
                        + "Z"
                        + "M" + (2.5 * x) + "," + (y + 8)
                        + "V" + (2 * y - 8)
                        + "M" + (4.5 * x) + "," + (y + 8)
                        + "V" + (2 * y - 8);
                }
            }

            brush.on("brushstart.chart", function () {
                var div = d3.select(this.parentNode.parentNode.parentNode);
                div.select(".title a").style("display", null);
            });

            brush.on("brush.chart", function () {
                var g = d3.select(this.parentNode),
                    extent = brush.extent();
                if (round) g.select(".brush")
                    .call(brush.extent(extent = extent.map(round)))
                    .selectAll(".resize")
                    .style("display", null);
                g.select("#clip-" + id + " rect")
                    .attr("x", x(extent[0]))
                    .attr("width", x(extent[1]) - x(extent[0]));
                dimension.filterRange(extent);
            });

            brush.on("brushend.chart", function () {
                if (brush.empty()) {
                    var div = d3.select(this.parentNode.parentNode.parentNode);
                    div.select(".title a").style("display", "none");
                    div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
                    dimension.filterAll();
                }
            });

            chart.margin = function (_) {
                if (!arguments.length) return margin;
                margin = _;
                return chart;
            };

            chart.x = function (_) {
                if (!arguments.length) return x;
                x = _;
                axis.scale(x);
                axis.ticks(5);
                //   axis.ticks(5).map(x.tickFormat(5,"+%"));
                brush.x(x);
                return chart;
            };

            chart.y = function (_) {
                if (!arguments.length) return y;
                y = _;
                return chart;
            };

            chart.dimension = function (_) {
                if (!arguments.length) return dimension;
                dimension = _;
                return chart;
            };

            chart.filter = function (_) {
                if (_) {
                    brush.extent(_);
                    dimension.filterRange(_);
                } else {
                    brush.clear();
                    dimension.filterAll();
                }
                brushDirty = true;
                return chart;
            };

            chart.group = function (_) {
                if (!arguments.length) return group;
                group = _;
                return chart;
            };

            chart.round = function (_) {
                if (!arguments.length) return round;
                round = _;
                return chart;
            };
            return d3.rebind(chart, brush, "on");
        }
    });
}

