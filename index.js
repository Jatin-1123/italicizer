const { Plugin } = require('powercord/entities');
const { getModule, React, messages, channels } = require('powercord/webpack');
const { inject, uninject} = require('powercord/injector');
const { findInReactTree } = require('powercord/util');

const Settings = require('./components/Settings');
const Button = require('./components/Button');
let italicizerAutoToggle = false;

module.exports = class Italicize extends Plugin { 
  async startPlugin () {
    this.addButton();
    powercord.api.settings.registerSettings(this.entityID, {
      category: this.entityID,
      label: 'Italicizer',
      render: (props) => React.createElement(Settings, {
        main:this,
        ...props
      })
    }); 

    const getSetting = (setting, defaultValue) => this.settings.get(setting, defaultValue);

    function italicizeText(words) {
      var output = `_${words}_`;

      return output
    }
    
    const messageEvents = await getModule(["sendMessage"]);
    inject("owoifierSend", messageEvents, "sendMessage", function(args) {
      if(italicizerAutoToggle) {
        let text = args[1].content;
        text = italicizeText(text);
        args[1].content = text;      
      }      
      return args;  
    }, true);

    powercord.api.commands.registerCommand({
      command: 'italize',
      description: 'italicize your message',
      usage: '{c} [ text ]',
      executor: (args) => ({send: true, result: italicizeText(args.join(' '))})
    });
    powercord.api.commands.registerCommand({
      command: 'italicizeauto',
      description: `italicizes all of your messages`,
      executor: this.toggleAuto.bind(this)
    });    
  }
  
  addButton() {    
    const ChannelTextAreaContainer = getModule(
        m =>
            m.type &&
            m.type.render &&
            m.type.render.displayName === "ChannelTextAreaContainer",
        false
    );

    inject(
        "italicizeButton",
        ChannelTextAreaContainer.type,
        "render",
        (args, res) => {
            const props = findInReactTree(
                res,
                r => r && r.className && r.className.indexOf("buttons-") === 0
            );

            const element = React.createElement(
                "div",
                {
                    className: ".italicizerButton",
                    onClick: () => this.toggleAuto(),
                },
                React.createElement(Button)
            );
            
            const btnEnb = this.settings.get("buttonEnabled", true);
            const posSetting = this.settings.get("buttonPos", false);
            if(btnEnb) {posSetting ? props.children.push(element) : props.children.unshift(element);}
            return res;
        }
    );
    ChannelTextAreaContainer.type.render.displayName = "ChannelTextAreaContainer";
}

  pluginWillUnload() {
    powercord.api.settings.unregisterSettings(this.entityID);
    uninject("owoifierSend"); 
    powercord.api.commands.unregisterCommand('italicizeauto');   
    powercord.api.commands.unregisterCommand('italize');   
    uninject("italicizeButton");
    const button = document.querySelector('.italicizerButton');
    if(button) button.remove();
  }

  toggleAuto () {
    italicizerAutoToggle = !italicizerAutoToggle;
    powercord.api.notices.sendToast('italicizeNotif', {
      header: `Italicize Auto Status`,
      content: `${(italicizerAutoToggle == true) ? '_Its ready to go!_' : 'Back to normal.'}`,
      timeout: 3e3,
    });
  }
};