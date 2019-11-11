interface MyWindow extends Window {
    serverSource: any;
  }
  
  declare var Window: {
    prototype: Window;
    new(): Window;
  };