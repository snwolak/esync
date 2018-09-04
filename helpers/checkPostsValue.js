const checkPostsValue = props => {
  return props.reduce((a, b) => {
    return Number(a) + Number(b);
  });
};
module.exports = {
  checkPostsValue
};