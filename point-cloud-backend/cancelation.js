// Factory to create a token
const cancellationToken = () => {
    let _cancelled = false;
  
    function check() {
      if (_cancelled == true) {
        throw new Error('Request cancelled');
      }
    }
  
    function cancel() {
      _cancelled = true;
    }
  
    return {
      check: check,
      cancel: cancel
    };
  }

  const reqs = {};
  
  // Middleware to create tokens.
  app.use(function *(next) {
    const reqId = crypto.randomBytes(32).toString('hex');
    const ct = cancellationToken();
    reqs[reqId] = ct;
    this.cancellationToken = ct;
    yield next;
  
    delete reqs[reqId];
  });