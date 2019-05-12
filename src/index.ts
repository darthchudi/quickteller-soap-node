import quickteller from './quickteller';

(async () => {
  try {
    await quickteller.init();
    const res = await quickteller.getBillerCategories();
    console.log(res);
  } catch (err) {
    console.log(err);
  }
})();
