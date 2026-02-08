use makepad_widgets::*;
use zubi_core::{Ride, Location, Did};

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
                    text: "Zubi",
                    draw_text: {
                        text_style: {font_size: 30.0, font_weight: 700.0},
                        color: #000
                    }
                }

                <Label> {
                    text: "Where to?",
                    draw_text: {color: #555}
                }

                // Mock Input (Button simulating input for MVP)
                dest_input = <Button> {
                    text: "Select Destination: Paulista Ave"
                }

                request_btn = <Button> {
                    text: "Request Ride (Pay via Polygon)",
                    draw_bg: {color: #228822}
                }

                status_label = <Label> {
                    text: "No active rides",
                    draw_text: {color: #888, font_size: 12.0}
                }
            }
        }
    }
}

#[derive(Live)]
pub struct App {
    #[live] ui: WidgetRef,
    #[rust] current_ride: Option<Ride>,
}

impl LiveHook for App {
    fn before_live_design(cx: &mut Cx) {
        crate::makepad_widgets::live_design(cx);
    }
}

impl AppMain for App {
    fn handle_event(&mut self, cx: &mut Cx, event: &Event) {
        if let Event::Draw(draw) = event {
            return self.ui.draw_widget_all(&mut DrawEntry::new(cx, draw));
        }

        let actions = self.ui.handle_widget_event(cx, event);

        if self.ui.button(id!(request_btn)).clicked(&actions) {
            // Mock da criação da corrida
            let origin = Location { lat: -23.55, lng: -46.63 };
            let dest = Location { lat: -23.58, lng: -46.65 };
            
            self.current_ride = Some(Ride::new(
                Did("did:zubi:passenger:me".to_string()), 
                origin, 
                dest
            ));

            self.ui.label(id!(status_label)).set_text("Searching for drivers via Nostr...");
            self.ui.redraw(cx);
        }
    }
}

app_main!(App);
