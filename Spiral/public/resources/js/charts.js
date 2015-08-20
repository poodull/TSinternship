/**
 * Created by Tommy Fang
 */
//Holds all the charts that are rendered onto the screen.
var charts;
//These flags toggle which color scheme to use.
var freqToggle = false, bwToggle = false, tlwToggle = true;
//These the actual scales, so that they can be used in this file,
//as well as during the creation of a signal in _scene.js
var freqScale, bwScale, sizeScale, tlwScale;
var _selectedArr = [];
function FilterCharts(signals) {
    //Signals is the csv file that was sent from the server
    // Various formatters.
    //used to format the timestamp to make it readable.
    var formatNumber = d3.format(",d"),
        formatChange = d3.format("+,d"),
        formatDate = d3.time.format("%B %d, %Y"),
        formatTime = d3.time.format("%I:%M:%S %p");

    // A nest operator, for grouping the signal list.
    var nestByDate = d3.nest()
        .key(function (d) {
            return d3.time.day(d.date);
        });
    var nestByTCode = d3.nest()
        .key(function (d) {
            return d.tcode;
        });
    //Take all of the columns and convert it using d3.
    //If you get a "maximum stack call" error, it means there was an invalid field
    //or a line is missing data for one of the fields.
    //The parser will attempt to get data from the field until it reaches the end.
    signals.forEach(function (d, i) {
        d.index = i;
        d.date = parseDate(d.TIMESTAMP);
        d.bw = +(d.BW / 1000);
        d.freq = +((d.FREQ / 100000)).toFixed(1); //convert to mhz, round to 1 decimal
        d.amp = +d.AMP;
        d.tcode = +d.TCODE;
        d.txid = +d.TXID;
        d.devcnt = +d.DEVCNT;
        d.tlw = +(d.TLW);
    });

    // Create the crossfilter for the relevant dimensions and groups.
    var signal = crossfilter(signals),
        all = signal.groupAll(),
    //The group method intersects the current crossfilter
    //It takes in records from signals that matches the current filter
    //The rounded number is used to determine how many signals should be
    //represented within an interval on the chart.
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
            return Math.floor(d / 10) * 10;// 5) * 5;
        }),
        bandwidth = signal.dimension(function (d) {
            return d.bw;
        }),
        bandwidths = bandwidth.group(function (d) {
            return Math.floor(d / 1000) * 1000;// 5) * 5;
        }),
        amplitude = signal.dimension(function (d) {
            return d.amp;
        }),
        amplitudes = amplitude.group(function (d) {
            return Math.floor(d / 10) * 10;
        }),
        TLW = signal.dimension(function (d) {
            return d.tlw;
        }),
        TLWs = TLW.group(function (d) {
            return Math.floor(d / 2) * 2;
        }),
    //Calculate the max and mins of the ranges
    //So we can use them to determine the range of the charts
    //And also the domains of the scales.
        ampMax = d3.max(signals, function (d) {
            return d.amp;
        }),
        ampMin = d3.min(signals, function (d) {
            return d.amp;
        }),
        freqMax = d3.max(signals, function (d) {
            return d.freq;
        }),
        freqMin = d3.min(signals, function (d) {
            return d.freq;
        }),
        bwMax = d3.max(signals, function (d) {
            return d.bw;
        }),
        bwMin = d3.min(signals, function (d) {
            return d.bw;
        }),
        tcMax = d3.max(signals, function (d) {
            return d.tcode;
        }),
        tcMin = d3.min(signals, function (d) {
            return d.tcode;
        }),
        tlwMax = d3.max(signals, function (d) {
            return d.tlw;
        }),
        tlwMin = d3.min(signals, function (d) {
            return d.tlw;
        });
    //Increase the range because the values at the end are buggy.
    //obtain an output value by inputting within the range of a variable
    //sizeScale(amplitude) = number between 30 and 60. Increase the range amp
    //If it seems too small on scale.
    sizeScale = d3.scale.linear().domain([ampMin, ampMax]).range([5, 10]);
    freqScale = d3.scale.linear().domain([freqMin, freqMax]);
    //Dependent on domain, output the according color
    //We match a range within the domain to a corresponding value in the range.
    //0-0.14 is red, 0.14-0.28 is orange, etc.
    freqScale.domain([0, 0.14, 0.28, 0.42, 0.57, 0.71, 0.85, 1]
        .map(freqScale.invert))
        .range(["red", "orange", "yellow", "green", "blue", "indigo", "violet"]);

    bwScale = d3.scale.linear().domain([bwMin, bwMax]); //Dependent on domain, output the according color <--may need to be constantly updated.
    bwScale.domain([0, 0.14, 0.28, 0.42, 0.57, 0.71, 0.85, 1]
        .map(bwScale.invert))
        .range(["red", "orange", "yellow", "green", "blue", "indigo", "violet"]);
    tlwScale = d3.scale.linear().domain([tlwMin, tlwMax]); //Dependent on domain, output the according color <--may need to be constantly updated.
    tlwScale.domain([0, 0.3, 0.6, 0.9]
        .map(tlwScale.invert))
        .range(["green", "orangered", "orange", "red"]);
    charts = [
        barChart()
            .dimension(frequency)
            .group(frequencies)
            .x(d3.scale.linear()
                //I attempted to fix these ranges by hard coding in some constants
                //The issue is that these current domains are not inclusive
                //At freqmax, the bar representing a signal with value of freqMax will render off the charts
                //at the end. It occurs with all of the domains in this chart array. I believe it has something to
                //do with rangeRound or the setup of the grouping function. see above.
                .domain([freqMin, freqMax + 200])
                .rangeRound([0, 2 * 130])),
        barChart()
            .dimension(bandwidth)
            .group(bandwidths)
            .x(d3.scale.linear()
                .domain([bwMin - 1000, bwMax + 2000])
                .rangeRound([0, 10 * 30])),

        barChart()
            .dimension(amplitude)
            .group(amplitudes)
            .x(d3.scale.linear()
                .domain([ampMin - 10, ampMax + 17])
                .rangeRound([0, 115])),
        barChart()
            .dimension(TLW)
            .group(TLWs)
            .x(d3.scale.linear()
                .domain([tlwMin - 1, tlwMax + 1])
                .rangeRound([0, 10 * 12])),
        barChart()
            .dimension(timecode)
            .group(timecodes)
            .x(d3.scale.linear()
                .domain([tcMin, tcMax + 10])
                .rangeRound([0, 100 * 8]))
            .filter(null)
            // filters the selection of existing signals with all values of timecode


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
    this.updateFilter = function (min, max) {
        //charts[4] is the time chart
        //used in the main animation loop.
        //live updates the filtered selection of signals and renders them.
        charts[4].filter([min, max]);
        renderAll();
    };

    // Given our array of charts, which we assume are in the same order as the
    // .chart elements in the DOM, bind the charts to the DOM and render them.
    // We also listen to the chart's brush events to update the display.
    var chart = d3.selectAll(".chart")
            .data(charts)
            .each(function (chart) {
                chart.on("brush", renderAll).on("brushend", renderAll);
            }),

    // Render the initial lists.
        list = d3.selectAll(".list")
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
    window.toggleFrequency = function () {
        tlwToggle = false; //Set other toggle flags to false
        bwToggle = false;
        freqToggle = true;
        var SignalDictLength = SignalDictionary.length;
        //Check if there are objects that can change color
        if (freqToggle && SignalDictLength != 0) {
            var SignalFreq, color, newColor;
            //loop through dictionary and change all signal colors.
            for (var id in SignalDictionary) {
                if (SignalDictionary.hasOwnProperty(id)) {
                    SignalFreq = ((SignalDictionary[id].userData.freq));
                    //create a new color based on the toggle using the scale.
                    //freqScale(SignalFreq) returns a hexadecimal value.
                    //I'm not sure how much this function affects performance, further testing needs to be done
                    //It doesn't seem to have a problem coloring small batches of signals very quickly.
                    newColor = new THREE.Color(freqScale(SignalFreq));
                    //We can only change the color of the material of the object.
                    color = SignalDictionary[id].material.color;
                    _Animator.TweenColor(color,newColor).start();
                }
            }
        }
    };
    window.toggleBandwidth = function () {
        bwToggle = true;
        freqToggle = false;
        tlwToggle = false;
        var signalDictLength = SignalDictionary.length;
        if (bwToggle && signalDictLength != 0) {
            var bandwidth, color, newColor;
            for (var id in SignalDictionary) {
                if (SignalDictionary.hasOwnProperty(id)) {
                    bandwidth = ((SignalDictionary[id].userData.bw));
                    newColor = new THREE.Color(bwScale(bandwidth));
                    color = SignalDictionary[id].material.color;
                    _Animator.TweenColor(color,newColor).start();

                }
            }
        }
    };
    window.toggleTLW = function () {
        tlwToggle = true;
        bwToggle = false;
        freqToggle = false;
        if (tlwToggle && SignalDictionary.length != 0) {
            var tlw, color,newColor;
            for (var id in SignalDictionary) {
                if (SignalDictionary.hasOwnProperty(id)) {
                    tlw = ((SignalDictionary[id].userData.TLW));
                    newColor = new THREE.Color(tlwScale(tlw));
                   color = SignalDictionary[id].material.color;
                    _Animator.TweenColor(color, newColor);

                }
            }
        }
    };

    window.reset = function (i) {
        charts[i].filter(null);
        renderAll();
    };
    function ToggleCheck(d){
        var TLW, BW, FREQ, color;
        if (tlwToggle) {
            TLW = d.tlw;
            color = new THREE.Color(tlwScale(TLW));
        }
        else if (bwToggle) {
            BW = d.bw;
            color = new THREE.Color(bwScale(BW));
        }
        else if (freqToggle) {
            FREQ = d.freq;
            color = new THREE.Color(freqScale(FREQ));
        }
        return color;

    }
    function signalList(div) {
        var signalsByDate = nestByDate.entries(timecode.bottom(50));
        if (signalsByDate != null) {
            //Infinity selects ALL records in the current filtered data.
            selected = nestByDate.entries(timecode.bottom(Infinity));
            if (selected[0] == null){
                currentTimeIndex++;
            }
        }
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
             });
             This shows the date,month,year of the signals.
             */


            date.exit().remove();
            //Select a single signal within the signal table.
            var signal = date.order().selectAll(".signal")
                .data(function (d) {
                    return d.values;
                }, function (d) {
                    return d.index;
                });

            //Display the variables values for each signal within the table.
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
                    //Round Floats to one decimal

                    return d.amp;
                });
            signalEnter.append("div")
                .attr("class", "DEVICECOUNT")
                .text(function (d) {
                    return d.devcnt;
                });
            signalEnter.append("div")
                .attr("class", "TLW")
                .text(function (d) {
                    return d.tlw;
                });
            /*      signalEnter.append("div")
             .attr("class", "TCODE")
             .text(function (d) {
             return d.tcode;
             });*/
            //Toggle selection on click. We can select the signal on the map and within the table.
            signal.on("click", function (d) {
                var SignalObject = SignalDictionary[d.txid];
                //Flag the signal to be selected.
                SignalObject.userData.selected = !SignalObject.userData.selected;
                if (SignalObject.userData.selected) {
                    //Highlight the signal in the table
                    d3.select(this).style("background", "magenta");
                }
                else {
                    //Unhighlight if unselected.
                    if (_selectedArr[d.txid] != null) {
                        delete _selectedArr[d.txid];
                    }
                    d3.select(this).style("background", "black");
                }
            });
            var color, material, newColor;
            signal.each(function (d) {
                var signalObject = SignalDictionary[d.txid];
                var selectedLength = Object.keys(_selectedArr).length;
                //Loop through each signal and check if they are selected, so that the _renderer
                //doesn't cause the signal to be unhighlighted.
                //I think this function could be vastly improved.
                //I attempted to add a check like this upon creation of an individual signal at a time,
                //but, it didn't work. I believe this function will check every signal every time a signal is added
                //So, theres major room for improvement in this function
                if (signalObject != null) {
                    material = signalObject.material;
                    color = material.color;
                    var selectedFlag = signalObject.userData.selected;
                    if (!selectedFlag && selectedLength > 0) {
                       // newColor = new THREE.Color("#29293D");
                       // console.log(newColor);
                        //_Animator.TweenColor(color,newColor).start();
                       color.setHex("##669999");
                    }
             /*       else if (selectedFlag && tlwToggle) {
                        //For constant TLW changes
                        //change the color of the signal based on new TLW value
                        TLW = d.tlw;
                        color = new THREE.Color(tlwScale(TLW));
                        if (material.color != color && _signalSelected != true) {
                            material.color = color;
                        }
                    }*/
                    if (selectedFlag) {
                        newColor = ToggleCheck(d);
                        material.color = newColor;
                        //signalObject.position.y += 50;
                        if (_selectedArr[d.txid] == null) {
                            _selectedArr[d.txid] = signalObject;
                        }
                        d3.select(this).style("background", "magenta");
                        //Change the opacity of the object on the map.
                        if (material.opacity != 0.8) {
                            material.opacity = 0.8;
                        }

                    }
                    else if (!selectedFlag && selectedLength == 0) {
                        material.opacity = 0.1;
                        newColor = ToggleCheck(d);
                        material.color = newColor;
                     /*   TLW = d.tlw;
                        newColor = new THREE.Color(tlwScale(TLW));
                        _Animator.TweenColor(color,newColor).start();*/
                    }
                }
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
                    div.select(".title")
                        .append("a")
                        .attr("href", "javascript:reset(" + id + ")")
                        .attr("class", "reset")
                        .text("reset");
                    //   .style("display", "none");


                    g = div.append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .attr("fill", "green")
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    g.append("clipPath")
                        .attr("id", "clip-" + id)
                        .append("rect")
                        .attr("width", Math.abs(width))
                        .attr("height", Math.abs(height));


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
                    //  div.select(".title a").style("display", brush.empty() ? "none" : null);
                    if (brush.empty()) {
                        g.selectAll("#clip-" + id + " rect")
                            .attr("x", 0)
                            .attr("width", Math.abs(width));
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
                div.select(".title a").style("display", "null");
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
}

