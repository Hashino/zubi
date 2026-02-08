use crate::makepad_widgets::*;
use zubi_core::DriverProfile;

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
            
            body = {
                flow: Down,
                spacing: 10,
                padding: 20,
                
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

#[derive(Live, LiveHook)]
pub struct App {
    #[live] ui: WidgetRef,
    #[rust] driver_profile: DriverProfile,
    #[rust] is_online: bool,
}

impl LiveRegister for App {
    fn live_register(cx: &mut Cx) {
        crate::makepad_widgets::live_design(cx);
    }
}

impl MatchEvent for App {
    fn handle_actions(&mut self, cx: &mut Cx, actions: &Actions) {
        if self.ui.button(id!(toggle_btn)).clicked(actions) {
            self.is_online = !self.is_online;
            self.update_ui(cx);
        }
        
        if self.ui.button(id!(validate_btn)).clicked(actions) {
            self.driver_profile.perform_oracle_work();
            self.update_ui(cx);
        }
    }
}

impl AppMain for App {
    fn handle_event(&mut self, cx: &mut Cx, event: &Event) {
        self.match_event(cx, event);
        self.ui.handle_event(cx, event, &mut Scope::empty());
    }
}

impl App {
    fn update_ui(&mut self, cx: &mut Cx) {
        let status = if self.is_online { "Status: ONLINE (Nostr Active)" } else { "Status: Offline" };
        self.ui.label(id!(status_label)).set_text(status);
        
        let tier = format!("{:?}", self.driver_profile.get_tier());
        let xp_text = format!("XP: {} ({}) - Tax: {}%", 
            self.driver_profile.xp, 
            tier,
            self.driver_profile.get_fee_percentage()
        );
        self.ui.label(id!(xp_label)).set_text(&xp_text);
        
        self.ui.redraw(cx);
    }
}

app_main!(App);
