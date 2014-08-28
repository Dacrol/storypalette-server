// Palette Controller
var crud = require('./crud')('palettes');

module.exports = {
  all: crud.all,
  one: crud.one,
  create: crud.create,
  update: crud.update,
  destroy: crud.destroy
};
