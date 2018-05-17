module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Data', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    value: {
      type: DataTypes.JSONB,
    },
  }, {
    timestamps: true,
    freezeTableName: true,
    tableName: 'data',
    underscored: true,
  });
}
