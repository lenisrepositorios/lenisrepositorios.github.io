/*
*  Copyright (C) 1998-2023 by Northwoods Software Corporation. All Rights Reserved.
*/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../release/go.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnapLinkReshapingTool = void 0;
    /*
    * This is an extension and not part of the main GoJS library.
    * Note that the API for this class may change with any version, even point releases.
    * If you intend to use an extension in production, you should copy the code to your own source directory.
    * Extensions can be found in the GoJS kit under the extensions or extensionsJSM folders.
    * See the Extensions intro page (https://gojs.net/latest/intro/extensions.html) for more information.
    */
    var go = require("../release/go.js");
    /**
     * The SnapLinkReshapingTool class lets the user snap link reshaping handles to the nearest grid point.
     * If {@link #avoidsNodes} is true and the link is orthogonal,
     * it also avoids reshaping the link so that any adjacent segments cross over any avoidable nodes.
     *
     * If you want to experiment with this extension, try the <a href="../../extensionsJSM/SnapLinkReshaping.html">Snap Link Reshaping</a> sample.
     * @category Tool Extension
     */
    var SnapLinkReshapingTool = /** @class */ (function (_super) {
        __extends(SnapLinkReshapingTool, _super);
        function SnapLinkReshapingTool() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._gridCellSize = new go.Size(NaN, NaN);
            _this._gridOrigin = new go.Point(NaN, NaN);
            _this._isGridSnapEnabled = true;
            _this._avoidsNodes = true;
            // internal state
            _this._safePoint = new go.Point(NaN, NaN);
            _this._prevSegHoriz = false;
            _this._nextSegHoriz = false;
            return _this;
        }
        Object.defineProperty(SnapLinkReshapingTool.prototype, "gridCellSize", {
            /**
             * Gets or sets the {@link Size} of each grid cell to which link points will be snapped.
             *
             * The default value is NaNxNaN, which means use the {@link Diagram#grid}'s {@link Panel#gridCellSize}.
             */
            get: function () { return this._gridCellSize; },
            set: function (val) {
                if (!(val instanceof go.Size))
                    throw new Error('new value for SnapLinkReshapingTool.gridCellSize must be a Size, not: ' + val);
                this._gridCellSize = val.copy();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(SnapLinkReshapingTool.prototype, "gridOrigin", {
            /**
             * Gets or sets the {@link Point} origin for the grid to which link points will be snapped.
             *
             * The default value is NaN,NaN, which means use the {@link Diagram#grid}'s {@link Panel#gridOrigin}.
             */
            get: function () { return this._gridOrigin; },
            set: function (val) {
                if (!(val instanceof go.Point))
                    throw new Error('new value for SnapLinkReshapingTool.gridOrigin must be a Point, not: ' + val);
                this._gridOrigin = val.copy();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(SnapLinkReshapingTool.prototype, "isGridSnapEnabled", {
            /**
             * Gets or sets whether a reshape handle's position should be snapped to a grid point.
             * This affects the behavior of {@link #computeReshape}.
             *
             * The default value is true.
             */
            get: function () { return this._isGridSnapEnabled; },
            set: function (val) {
                if (typeof val !== 'boolean')
                    throw new Error('new value for SnapLinkReshapingTool.isGridSnapEnabled must be a boolean, not: ' + val);
                this._isGridSnapEnabled = val;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(SnapLinkReshapingTool.prototype, "avoidsNodes", {
            /**
             * Gets or sets whether a reshape handle's position should only be dragged where the
             * adjacent segments do not cross over any nodes.
             * This affects the behavior of {@link #computeReshape}.
             *
             * The default value is true.
             */
            get: function () { return this._avoidsNodes; },
            set: function (val) {
                if (typeof val !== 'boolean')
                    throw new Error('new value for SnapLinkReshapingTool.avoidsNodes must be a boolean, not: ' + val);
                this._avoidsNodes = val;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * This override records information about the original point of the handle being dragged,
         * if the {@link #adornedLink} is Orthogonal and if {@link #avoidsNodes} is true.
         */
        SnapLinkReshapingTool.prototype.doActivate = function () {
            _super.prototype.doActivate.call(this);
            if (this.isActive && this.avoidsNodes && this.adornedLink !== null && this.adornedLink.isOrthogonal && this.handle !== null) {
                // assume the Link's route starts off correctly avoiding all nodes
                this._safePoint = this.diagram.lastInput.documentPoint.copy();
                var link = this.adornedLink;
                var idx = this.handle.segmentIndex;
                this._prevSegHoriz = Math.abs(link.getPoint(idx - 1).y - link.getPoint(idx).y) < 0.5;
                this._nextSegHoriz = Math.abs(link.getPoint(idx + 1).y - link.getPoint(idx).y) < 0.5;
            }
        };
        ;
        /**
         * Pretend while dragging a reshape handle the mouse point is at the nearest grid point, if {@link #isGridSnapEnabled} is true.
         * This uses {@link #gridCellSize} and {@link #gridOrigin}, unless those are not real values,
         * in which case this uses the {@link Diagram#grid}'s {@link Panel#gridCellSize} and {@link Panel#gridOrigin}.
         *
         * If {@link #avoidsNodes} is true and the adorned Link is {@link Link#isOrthogonal},
         * this method also avoids returning a Point that causes the adjacent segments, both before and after
         * the current handle's index, to cross over any Nodes that are {@link Node#avoidable}.
         */
        SnapLinkReshapingTool.prototype.computeReshape = function (p) {
            var pt = p;
            var diagram = this.diagram;
            if (this.isGridSnapEnabled) {
                // first, find the grid to which we should snap
                var cell = this.gridCellSize;
                var orig = this.gridOrigin;
                if (!cell.isReal() || cell.width === 0 || cell.height === 0)
                    cell = diagram.grid.gridCellSize;
                if (!orig.isReal())
                    orig = diagram.grid.gridOrigin;
                // second, compute the closest grid point
                pt = p.copy().snapToGrid(orig.x, orig.y, cell.width, cell.height);
            }
            if (this.avoidsNodes && this.adornedLink !== null && this.adornedLink.isOrthogonal) {
                if (this._checkSegmentsOverlap(pt)) {
                    this._safePoint = pt.copy();
                }
                else {
                    pt = this._safePoint.copy();
                }
            }
            // then do whatever LinkReshapingTool would normally do as if the mouse were at that point
            return _super.prototype.computeReshape.call(this, pt);
        };
        /**
         * @hidden @internal
         * Internal method for seeing whether a moved handle will cause any
         * adjacent orthogonal segments to cross over any avoidable nodes.
         * Returns true if everything would be OK.
         */
        SnapLinkReshapingTool.prototype._checkSegmentsOverlap = function (pt) {
            if (this.handle === null)
                return true;
            if (this.adornedLink === null)
                return true;
            var index = this.handle.segmentIndex;
            if (index >= 1) {
                var p1 = this.adornedLink.getPoint(index - 1);
                var r = new go.Rect(pt.x, pt.y, 0, 0);
                var q1 = p1.copy();
                if (this._prevSegHoriz) {
                    q1.y = pt.y;
                }
                else {
                    q1.x = pt.x;
                }
                r.unionPoint(q1);
                var overlaps = this.diagram.findPartsIn(r, true, false);
                if (overlaps.any(function (p) { return p instanceof go.Node && p.avoidable; }))
                    return false;
                if (index >= 2) {
                    var p0 = this.adornedLink.getPoint(index - 2);
                    var r_1 = new go.Rect(q1.x, q1.y, 0, 0);
                    if (this._prevSegHoriz) {
                        r_1.unionPoint(new go.Point(q1.x, p0.y));
                    }
                    else {
                        r_1.unionPoint(new go.Point(p0.x, q1.y));
                    }
                    var overlaps_1 = this.diagram.findPartsIn(r_1, true, false);
                    if (overlaps_1.any(function (p) { return p instanceof go.Node && p.avoidable; }))
                        return false;
                }
            }
            if (index < this.adornedLink.pointsCount - 1) {
                var p2 = this.adornedLink.getPoint(index + 1);
                var r = new go.Rect(pt.x, pt.y, 0, 0);
                var q2 = p2.copy();
                if (this._nextSegHoriz) {
                    q2.y = pt.y;
                }
                else {
                    q2.x = pt.x;
                }
                r.unionPoint(q2);
                var overlaps = this.diagram.findPartsIn(r, true, false);
                if (overlaps.any(function (p) { return p instanceof go.Node && p.avoidable; }))
                    return false;
                if (index < this.adornedLink.pointsCount - 2) {
                    var p3 = this.adornedLink.getPoint(index + 2);
                    var r_2 = new go.Rect(q2.x, q2.y, 0, 0);
                    if (this._nextSegHoriz) {
                        r_2.unionPoint(new go.Point(q2.x, p3.y));
                    }
                    else {
                        r_2.unionPoint(new go.Point(p3.x, q2.y));
                    }
                    var overlaps_2 = this.diagram.findPartsIn(r_2, true, false);
                    if (overlaps_2.any(function (p) { return p instanceof go.Node && p.avoidable; }))
                        return false;
                }
            }
            return true;
        };
        ;
        return SnapLinkReshapingTool;
    }(go.LinkReshapingTool));
    exports.SnapLinkReshapingTool = SnapLinkReshapingTool;
});
