techanModule('scale/financetime', function(specBuilder) {
  'use strict';

  var techan = require('../../../../src/techan');

  var actualInit = function() {
    return techan.scale.financetime;
  };

  var data = require('../_fixtures/data/ohlc').facebook.slice(0, 10).map(function(d) { return d.date; }),
      timeData = require('../_fixtures/data/time').intraday;

  specBuilder.require(require('../../../../src/scale/financetime'), function(instanceBuilder) {
    instanceBuilder.instance('actual', actualInit, function(scope) {
      var financetime;

      describe('And domain and range is initialised', function() {
        beforeEach(function() {
          financetime = scope.financetime;
          financetime.domain(data).range([48, 1052]);
        });

        it('Then domain should equal the domain set', function() {
          expect(financetime.domain()).toEqual(data);
        });

        it('Then range should return the range set', function() {
          expect(financetime.range()).toEqual([48, 1052]);
        });

        it('Then band should correct band', function() {
          expect(financetime.band()).toEqual(80);
        });

        it('Then scale of first index should return min range', function() {
          expect(financetime(data[0])).toEqual(100);
        });

        it('Then scale of a value less than minimum should return less than minimum range', function() {
          expect(financetime(+data[0] - 100)).toEqual(0); // just a bit less, should round down
        });

        it('Then scale of a value greater than maximum should return greater than maximum range', function() {
          expect(financetime(+data[data.length-1] + 10)).toEqual(1100); // Just a bit more, should round up
        });

        it('Then scale of a value between domain min/max but not exact value should return nearest range', function() {
          expect(financetime(+data[3]+100)).toEqual(500);
        });

        it('Then invert of just over min range should return the first domain', function() {
          expect(financetime.invert(101)).toEqual(data[0]);
        });

        it('Then invert of just under max range should return the last domain', function() {
          expect(financetime.invert(1020)).toEqual(data[data.length-1]);
        });

        it('Then invertToIndex of just over min range should return the first domain index', function() {
          expect(financetime.invertToIndex(101)).toEqual(0);
        });

        it('Then invertToIndex of less than min range should return null', function() {
          expect(financetime.invertToIndex(40)).toBeNull();
        });

        it('Then invertToIndex of just under max range should return the last domain index', function() {
          expect(financetime.invertToIndex(1020)).toEqual(data.length-1);
        });

        it('Then invertToIndex of greater max range should return null', function() {
          expect(financetime.invertToIndex(1060)).toBeNull();
        });

        it('Then invert(financetime(x)) should equal x for each in domain', function() {
            data.forEach(function(x) {
              expect(financetime.invert(financetime(x))).toEqual(x);
            });
        });

        it('Then invert of value before range, should return null', function() {
          expect(financetime.invert(40)).toBeNull();
        });

        it('Then invert of value after range, should return null', function() {
          expect(financetime.invert(1100)).toBeNull();
        });

        it('Then using invert as Array.prototyp.map(invert) of a value about half of range, should return mid domain', function() {
          expect([600].map(financetime.invert)).toEqual([data[5]]);
        });

        it('Then ticks should return a distributed range of ticks', function() {
          expect(financetime.ticks()).toEqual([
            new Date(2012, 4, 18),
            new Date(2012, 4, 21), // Irregular but continuous. Skipping where there is no domain (like weekends and holidays)
            new Date(2012, 4, 22),
            new Date(2012, 4, 23),
            new Date(2012, 4, 24),
            new Date(2012, 4, 25),
            new Date(2012, 4, 29),
            new Date(2012, 4, 30),
            new Date(2012, 4, 31),
            new Date(2012, 5, 1)
          ]);
        });

        it('Then ticks with specified tick count returns approximately that number', function() {
          expect(financetime.ticks(3)).toEqual([
            new Date(2012,4,21),
            new Date(2012,4,29)
          ]);
        });

        it('Then ticks with specified interval and step count returns that number', function() {
          expect(financetime.ticks(d3.time.day, 2)).toEqual([
            new Date(2012,4,21),
            new Date(2012,4,23),
            new Date(2012,4,25),
            new Date(2012,4,29),
            new Date(2012,4,31),
            new Date(2012,5,1)
          ]);
        });

        it('Then default tickFormat should be yearly', function() {
          expect(financetime.tickFormat()(new Date(2012,0,20))).toEqual('2012');
        });

        it('Then default tickFormat after ticks invoke should be day', function() {
          financetime.ticks();
          expect(financetime.tickFormat()(new Date(2012,0,20))).toEqual('Jan 20');
          expect(financetime.tickFormat()(new Date(2012,3,3))).toEqual('Apr  3');
        });

        describe('And copied', function() {
          var cloned;

          beforeEach(function() {
            cloned = financetime.copy();
          });

          it('Then should not be equal to source', function() {
            expect(cloned).not.toEqual(financetime);
          });

          it('Then domain should equal the domain set', function() {
            expect(cloned.domain()).toEqual(data);
          });

          it('Then range should return the range set', function() {
            expect(cloned.range()).toEqual([48, 1052]);
          });

          it('Then ticks should return a distributed range of ticks', function() {
            expect(cloned.ticks()).toEqual(financetime.ticks());
          });
        });

        describe('And a zoom applied', function() {
          var zoom,
              baselineScale;

          beforeEach(function() {
            zoom = d3.behavior.zoom();
            financetime = scope.financetime;
            zoom.x(financetime.zoomable());
            baselineScale = d3.scale.linear()
              .domain([-0.52, 9.52]) // Adjusted index domain taking to account the extra padding
              .range(financetime.range());
          });

          describe('And heavily scaled', function() {
            beforeEach(function() {
              zoom.scale(100);
            });

            it('Then domain should return empty', function() {
              expect(financetime.domain()).toEqual([]);
            });

            it('Then ticks should return empty', function() {
              expect(financetime.ticks()).toEqual([]);
            });
          });

          describe('And translated left', function() {
            beforeEach(function() {
              d3.behavior.zoom().x(baselineScale)
                  .scale(1.5).translate([-10, 0]);
              zoom.scale(1.5).translate([-10, 0]);
            });

            it('Then baseline scale range should return the range set', function() {
              expect(baselineScale.range()).toEqual([48, 1052]);
            });

            it('Then range should return the range set', function() {
              expect(financetime.range()).toEqual([48, 1052]);
            });

            it('Then baseline scale of first index should return min zoomed range', function() {
              expect(baselineScale(0)).toEqual(140.00000000000003);
            });

            it('Then scale of first index should return min range', function() {
              expect(financetime(data[0])).toEqual(127.10303030303034);
            });

            it('Then baseline scale of last index should return max zoomed range', function() {
              expect(baselineScale(data.length-1)).toEqual(1490.0000000000002);
            });

            it('Then scale of last index should return max range', function() {
              expect(financetime(data[data.length-1])).toEqual(1496.19393939394);
            });

            it('Then domain should return visible domain', function() {
              expect(financetime.domain()).toEqual(data.slice(0, 7));
            });

            it('Then ticks should return offset tick values', function() {
              expect(financetime.ticks()).toEqual([
                new Date(2012,4,18),
                new Date(2012,4,21),
                new Date(2012,4,22),
                new Date(2012,4,23),
                new Date(2012,4,24),
                new Date(2012,4,25),
                new Date(2012,4,29)
              ]);
            });

            it('Then ticks with specified tick count returns approximately that number', function() {
              expect(financetime.ticks(3)).toEqual([
                new Date(2012,4,21),
                new Date(2012,4,29)
              ]);
            });

            it('Then ticks with specified interval and step count returns that number', function() {
              expect(financetime.ticks(d3.time.day, 2)).toEqual([
                new Date(2012,4,21),
                new Date(2012,4,23),
                new Date(2012,4,25),
                new Date(2012,4,29)
              ]);
            });

            describe('And copied', function() {
              var cloned;

              beforeEach(function() {
                cloned = financetime.copy();
              });

              it('Then scale of first index should return min range', function() {
                expect(cloned(data[0])).toEqual(127.10303030303034);
              });

              it('Then scale of last index should return max range', function() {
                expect(cloned(data[data.length-1])).toEqual(1496.19393939394);
              });

              it('Then domain should return visible domain', function() {
                expect(financetime.domain()).toEqual(data.slice(0, 7));
              });

              it('Then ticks should return same offset tick values', function() {
                expect(cloned.ticks()).toEqual(financetime.ticks());
              });
            });
          });
        });

        describe('And initialised with 1 item', function() {
          beforeEach(function() {
            financetime.domain([new Date(0)]);
          });

          it('Then ticks should return a single tick', function() {
            expect(financetime.ticks()).toEqual([
              new Date(0)
            ]);
          });

          describe('And ticks invoked (for tickFormat state)', function() {
            beforeEach(function() {
              financetime.ticks();
            });

            it('Then tickFormat should be generic format', function() {
              expect(financetime.tickFormat()(new Date(1000))).toEqual(':01');
            });

            it('Then tickFormat should be generic format', function() {
              expect(financetime.tickFormat()(new Date(1000))).toEqual(':01');
              expect(financetime.tickFormat()(new Date(2014, 1, 24))).toEqual('Feb 24');
            });
          });
        });

        describe('And initialised with intraday data', function() {
          beforeEach(function() {
            financetime.domain(timeData);
          });

          it('Then ticks should return a distributed range of ticks', function() {
            expect(financetime.ticks()).toEqual([
              new Date(0),
              new Date(1000),
              new Date(2000),
              new Date(3000),
              new Date(4000),
              new Date(5000),
              new Date(6000),
              new Date(7000),
              new Date(8000),
              new Date(9000)
            ]);
          });

          describe('And ticks invoked (for tickFormat state)', function() {
            beforeEach(function() {
              financetime.ticks();
            });

            it('Then tickFormat should be intraday format', function() {
              expect(financetime.tickFormat()(new Date(1000))).toEqual(':01');
              expect(financetime.tickFormat()(new Date(2014, 1, 24, 9, 35))).toEqual('09:35');
            });
          });
        });

        describe('(SCRATCHPAD) And domain and range is initialised with symmetric data', function() {
          var index,
              time,
              zoomIndex,
              zoomTime;

          beforeEach(function() {
            index = d3.scale.linear().domain([0, timeData.length-1]).range([0, 1000]);
            time = d3.time.scale().domain([timeData[0], timeData[timeData.length-1]]).range([0, 1000]);
            zoomIndex = d3.behavior.zoom().x(index);
            zoomTime = d3.behavior.zoom().x(time);
          });

          it('Should have domain set correctly', function() {
            expect(index.domain()).toEqual([0, 9]);
            expect(time.domain()).toEqual([new Date(0), new Date(9000)]);
          });

          it('Should have 10 ticks equaling input data', function() {
            expect(time.ticks()).toEqual(timeData);
          });

          describe('And zoom applied to translate both scales to left', function() {
            beforeEach(function() {
              // Move across to get symmetrical number on the domain
              zoomIndex.translate([-111.11111111111111, 0]);
              zoomTime.translate([-111.11111111111111, 0]);
            });

            it('Should move proportionately resulting in round number domain', function() {
              expect(index.domain()).toEqual([1, 10]);
            });

            it('Should have index domain scale correctly applied to time domain ', function() {
              expect(time.domain()).toEqual([new Date(1000), new Date(10000)]);
            });
          });

          describe('And zoom applied to translate index scale to the left', function() {
            var indexToTime;

            beforeEach(function() {
              indexToTime = d3.scale.linear()
                .domain(index.domain())
                .range(time.domain().map(function(d) { return d.getTime(); }));

              // Move across to get symmetrical number on the domain
              zoomIndex.translate([-111.11111111111111, 0]);
            });

            it('Should move proportionately resulting in round number domain', function() {
              expect(index.domain()).toEqual([1, 10]);
            });

            it('Should have index domain scale correctly applied to time domain ', function() {
              time.domain(index.domain().map(indexToTime));
              expect(time.domain()).toEqual([new Date(1000), new Date(10000)]);
            });

            it('Should have 10 ticks equaling input offset to left', function() {
              expect(time.ticks()).toEqual(timeData);
            });
          });
        });
      });
    });
  });
});