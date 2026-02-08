use makepad_widgets::*;
use zubi_core::{DriverProfile, Did};

live_design! {
    use link::theme::*;
    use link::shaders::*;
    use link::widgets::*;

    App = {{App}} {
        ui: <Window> {
            body = <View> {
                flow: Down,
                spacing: 20.0,
                padding: 20.0,
                align: {x: 0.5, y: 0.0},

                <Label> {
                    text: "Zubi Driver",
                    draw_text: {
                        text_style: {font_size: 20.0},
                        color: #000
                    }
                }

                // --- Status Section ---
                status_label = <Label> {
                    text: "Status: Offline",
                    draw_text: {color: #666}
                }

                toggle_online_btn = <Button> {
                    text: "Go Online"
                }

                // --- Governance Section ---
                <View> {
                    flow: Down,
                    spacing: 10.0,
                    margin: {top: 30.0},
                    
                    <Label> {
                        text: "GOVERNANCE & XP",
                        draw_text: {text_style: {font_size: 14.0, top_drop: 1.2}, color: #333}
                    }
                    
                    xp_label = <Label> {
                        text: "Current XP: 0 (Initiate)",
                        draw_text: {color: #00f}
                    }

                    <Label> {
                        text: "Pending Validations: 1",
                        draw_text: {font_size: 9.0}
                    }

                    validate_btn = <Button> {
                        text: "Validate New Driver (+5 XP)"
                    }
                }
            }
        }
    }
}

#[derive(Live)]
pub struct App {
    #[live] ui: WidgetRef,
    #[rust] driver_profile: DriverProfile,
    #[rust] is_online: bool,
}

impl LiveHook for App {
    fn before_live_design(cx: &mut Cx) {
        crate::makepad_widgets::live_design(cx);
    }

    fn after_new_from_doc(&mut self, _cx: &mut Cx) {
        self.driver_profile = DriverProfile::new(Did("did:zubi:driver:me".to_string()));
    }
}

impl App {
    fn update_ui(&mut self, cx: &mut Cx) {
        // Atualiza Status
        let status_text = if self.is_online { "Status: ONLINE (Nostr Active)" } else { "Status: Offline" };
        self.ui.label(id!(status_label)).set_text(status_text);

        // Atualiza XP
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

impl AppMain for App {
    fn handle_event(&mut self, cx: &mut Cx, event: &Event) {
        if let Event::Draw(draw) = event {
            return self.ui.draw_widget_all(&mut DrawEntry::new(cx, draw));
        }

        let actions = self.ui.handle_widget_event(cx, event);

        if self.ui.button(id!(toggle_online_btn)).clicked(&actions) {
            self.is_online = !self.is_online;
            self.update_ui(cx);
        }

        if self.ui.button(id!(validate_btn)).clicked(&actions) {
            // Simula trabalho de oráculo
            self.driver_profile.perform_oracle_work();
            self.update_ui(cx);
        }
    }
}

app_main!(App);
