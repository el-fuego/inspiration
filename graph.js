/* ********************************* */
//    Построение графиков и диаграмм 
//    JavaScript + SVG
//
//
//    Author:   Pulyaev Y.A.
//
//    Email:    watt87@mail.ru
//    VK:       el_fuego_zaz
/* ********************************* */


/**
 @class Построение графиков и диаграмм
 @param {Object} settings
 @param {Object} settings.el Место вставки
 */
window.Graph = function (options) {

    // применим настройки
    this.$el = $(options.el || options.$el);
    this.options = $.extend({}, this.options, options);

    // Вычислим размер рабочей области
    this.options.workspaceWidth = this.options.width - this.options.paddingX * 2
    this.options.workspaceHeight = this.options.height - this.options.paddingY * 2

    // Создадим чистую рабочую область
    this.clear();
};

/** */
window.Graph.prototype = {


    /** Область svg */
    SVG_NS: "http://www.w3.org/2000/svg",

    /** Настройки по умолчанию */
    options: {

        // Ширина и высота графика
        width:         450,
        height:        140,

        // Отступы по краям
        paddingX:      10,
        paddingY:      10,

        // Размер точки на линейном графике
        pointDiameter: 8,

        // Расстояние между столбцами
        diagramStep:   5
    },


    /**
     Создание нового SVG-тега
     @param {String} name
     @param {Object} [attributes]
     @param {Object} [$container]
     @private
     */
    _render: function (name, attributes, $container) {

        var el = document.createElementNS(this.SVG_NS, name);
        var i;
        for (i in attributes || {}) {
            if (i) {
                el.setAttributeNS(null, i, attributes[i]);
            }
        }

        $($container || this.$workspace).append(el);
        return el;
    },


    /**
     Создание сектора круга
     @param {String} centerX
     @param {String} centerY
     @param {String} radius
     @param {String} startDegree
     @param {String} endDegree
     @param {Object} [attributes]
     @private
     */
    _renderSector: function (centerX, centerY, radius, startDegree, endDegree, attributes) {

        return this._render('path', $.extend(
            {
                d: 'M ' + centerX + ',' + centerY + ' ' +
                    'l ' + (radius * Math.cos(startDegree)) +
                        ',' + (radius * Math.sin(startDegree)) + ' ' +
                    'A ' + radius + ',' + radius + ',0,0,1,' +
                       (centerX + radius * Math.cos(endDegree)) + ',' +
                       (centerY + radius * Math.sin(endDegree)) + ' z'
            },
            attributes || {}
        ));
    },


    /**
     Создание рабочего простаранства
     @private
     */
    _renderWorkspace: function () {

        return $(document.createElementNS(this.SVG_NS, "g"))
            .attr({
                transform: 'translate(' + this.options.paddingX + ', ' + (this.options.height - this.options.paddingY) + ')'
            })
            .appendTo(
                $('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" ></svg>')
                    .attr({

                        width:  this.options.width,
                        height: this.options.height
                    })
                    .appendTo(this.$el)
            );
    },


    /**
     Очистка рабочего простаранства
     */
    clear: function () {

        if (this.$workspace) {
            this.$workspace.remove();
        }
        this.$workspace = this._renderWorkspace();
    },


    /**
     Вывод графика в виде линии
     @param {Array} values
     @param {Object} [options]
     */
    renderLine: function (values, options) {

        var self = this;
        options || (options = {});
        var ret = {};

        // Параетры вывода
        var step = options.step || this.options.workspaceWidth / (values.length - 1);
        var maxValue = options.maxValue || _.max(values);
        var pointRadius = (options.pointDiameter || self.options.pointDiameter) / 2;

        // Получим все точки кривой
        var svgPointsArray = _.map(values, function (val, i) {
            return (step * i) + ',' + (-1 * (val.value || val) * self.options.workspaceHeight / maxValue)
        });

        // Добавим по одной вначале и вконце для фона
        svgPointsArray.unshift(_.first(svgPointsArray).replace(/,[0-9.]+/, '') + ',0');
        svgPointsArray.push(_.last(svgPointsArray).replace(/,[0-9.]+/, '') + ',0');

        // Выведем фон
        ret.shape = this._render('polyline', $.extend({}, options || {}, {
            points: svgPointsArray.join(' '),
            'class': 'shape ' + (options['class'] || '')
        }));

        // Выведем кривую
        ret.line = this._render('polyline', $.extend({}, options || {}, {
            points: svgPointsArray.slice(1, svgPointsArray.length - 1).join(' ')
        }));

        // Выведем точки кривой
        ret.points = _.map(values, function (val, i) {

            var height = (val.value || val) * self.options.workspaceHeight / maxValue;
            return self._render('circle', $.extend({}, val.options || {}, {
                cx: step * i,
                cy: -height,
                r:  pointRadius
            }));

        });

        return ret;
    },


    /**
     Вывод графика в виде диаграммы
     @param {Array} values
     @param {Object} [options]
     */
    renderDiagram: function (values, options) {

        var self = this;
        options || (options = {});

        // Параетры вывода
        var step = options.step || this.options.diagramStep;
        var rectWidth = options.rectWidth || Math.round((this.options.workspaceWidth / values.length) - step);
        var maxValue = options.maxValue || _.max(values);

        // Выведем каждый элемент диаграммы
        return _.map(values, function (val, i) {

            var height = Math.round((val.value || val) * self.options.workspaceHeight / maxValue);

            // Выведем элемент диаграммы
            return self._render('rect', $.extend({}, val.options || {}, {
                x: Math.round((step + rectWidth) * i),
                y:      -height,
                width:  rectWidth,
                height: height
            }));

        });
    },

    /**
     * Вывод фильтра
     * @private
     */
    _renderGradient: function () {
        var size = _.min([this.options.workspaceWidth, this.options.workspaceHeight]);

        // FILTER
        var $filter = this._render("filter", {
            id: 'shadow'
        });

        // blur
        this._render("feGaussianBlur", {
            result: "offset-blur",
            stdDeviation: size / 4 // размер размытия
        }, $filter);

        // composite
        this._render('feComposite', {
            operator: 'arithmetic',
            k1:       '3',   // уровень фильтра
            k2:       '0.6', // уровень исходного изображения
            k3:       '0',
            k4:       '0',
            'in':     'SourceGraphic',
            in2:      'offset-blur'
        }, $filter);

        this.$workspace.attr({
            filter: 'url(#shadow)'
        });
    },

    /**
     Вывод графика в виде круговой диаграммы
     @param {Array} values
     @param {Object} [options]
     */
    renderCircleDiagram: function (values, options) {

        var self = this;
        options || (options = {});

        // Параетры вывода
        var valuesTotal = options.valuesTotal || _.reduce(values, function (total, val) {
            return total + (val.value || val);
        }, 0);
        var radius = _.min([self.options.workspaceHeight, self.options.workspaceWidth]) / 2;
        var centerX = radius;
        var centerY = -radius;
        var endDegree = 0;

        // Эффект
        this._renderGradient();

        // Выведем каждый элемент диаграммы
        return _.map(values, function (val, i) {
            var elementOptions = $.extend(
                {},
                val.options || {},
                {
                    'class': 'sector n' + i + (val.options && val.options['class'] ? ' ' + val.options['class'] : '')
                }
            );
            var startDegree = endDegree;
            endDegree = startDegree + (val.value || val) * 2 * Math.PI / valuesTotal;

            // Выведем сектор
            return self._renderSector(centerX, centerY, radius, startDegree, endDegree, elementOptions)
        });
    }
};
