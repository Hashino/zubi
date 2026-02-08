use crate::makepad_widgets::*;
use zubi_core::{DriverProfile, Did};

live_design! {
    import makepad_widgets::base::*;
    import makepad_widgets::theme_desktop_dark::*;

    App = {{App}} {
        ui: <Window> {
            show_bg: true,
            width: Fill,
            height: Fill,
            draw_bg: {
                fn pixel(self) -> vec4 {
                    return #fff
                }
            }
            
            body = <ScrollYView> {
                flow: Down,
                spacing: 10,
                padding: 20,
                
                <View> {
                    width: Fill,
                    height: Fit,
                    flow: Down,
                    spacing: 20,
                    
                    <Label> {
                        draw_text: {
                            text_style: <TITLE_TEXT>{},
                            color: #000
                        }
                        text: "Zubi Driver"
                    }
                    
                    status_label = <Label> {
                        draw_text: {
                            color: #666
                        }
                        text: "Status: Offline"
                    }
                    
                    toggle_btn = <Button> {
                        text: "Go Online"
                    }
                    
                    <Label> {
                        draw_text: {
                            text_style: <TITLE_TEXT>{font_size: 11},
                            color: #333
                        }
                        text: "GOVERNANCE & XP"
                    }
                    
                    xp_label = <Label> {
                        draw_text: {
                            color: #00f
                        }
                        text: "XP: 0 (Initiate)"
                    }
                    
                    validate_btn = <Button> {
                        text: "Validate Driver (+5 XP)"
                    }
                }
            }
        }
    }
}

#[derive(Live, LiveHook, Widget)]
pub struct App {
    #[deref] view: View,
    #[rust] driver_profile: DriverProfile,
    #[rust] is_online: bool,
}

impl Widget for App {
    fn handle_event(&mut self, cx: &mut Cx, event: &Event, scope: &mut Scope) {
        self.view.handle_event(cx, event, scope);
        self.widget_match_event(cx, event, scope);
    }
    
    fn draw_walk(&mut self, cx: &mut Cx2d, scope: &mut Scope, walk: Walk) -> DrawStep {
        self.view.draw_walk(cx, scope, walk)
    }
}

impl WidgetMatchEvent for App {
    fn handle_actions(&mut self, cx: &mut Cx, actions: &Actions, _scope: &mut Scope) {
        if self.button(id!(toggle_btn)).clicked(actions) {
            self.is_online = !self.is_online;
            self.update_ui(cx);
        }
        
        if self.button(id!(validate_btn)).clicked(actions) {
            self.driver_profile.perform_oracle_work();
            self.update_ui(cx);
        }
    }
}

impl AppMain for App {
    fn handle_event(&mut self, cx: &mut Cx, event: &Event) {
        self.match_event(cx, event);
        self.view.handle_event(cx, event, &mut Scope::empty());
    }
}

impl App {
    fn update_ui(&mut self, cx: &mut Cx) {
        let status = if self.is_online { "Status: ONLINE (Nostr Active)" } else { "Status: Offline" };
        self.label(id!(status_label)).set_text(status);
        
        let tier = format!("{:?}", self.driver_profile.get_tier());
        let xp_text = format!("XP: {} ({}) - Tax: {}%", 
            self.driver_profile.xp, 
            tier,
            self.driver_profile.get_fee_percentage()
        );
        self.label(id!(xp_label)).set_text(&xp_text);
        
        self.redraw(cx);
    }
}

app_main!(App);
