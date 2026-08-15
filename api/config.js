module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json');

  // এনভায়রনমেন্ট ভেরিয়েবল বাদ দিয়ে এখানে সরাসরি তোর কী-টা বসিয়ে দে
  const publishableKey = "pk_test_ZXRlcm5hbC1yZWRmaXNoLTI0LmNsZXJrLmFjY291bnRzLmRldiQ"; 

  res.status(200).json({ publishableKey: publishableKey });
};
