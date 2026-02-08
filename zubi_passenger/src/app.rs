use crate::makepad_widgets::*;
use zubi_core::{Ride, Location, Did};

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
                        text: "Zubi"
                    }
                    
                    <Label> {
                        draw_text: {
                            color: #555
                        }
                        text: "Where to?"
                    }
                    
                    dest_btn = <Button> {
                        text: "Select: Paulista Ave"
                    }
                    
                    request_btn = <Button> {
                        text: "Request Ride (Polygon)"
                    }
                    
                    status_label = <Label> {
                        draw_text: {
                            color: #888,
                            text_style: {font_size: 9}
                        }
                        text: "No active rides"
                    }
                }
            }
        }
    }
}

#[derive(Live, LiveHook, Widget)]
pub struct App {
    #[deref] view: View,
    #[rust] current_ride: Option<Ride>,
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
        if self.button(id!(request_btn)).clicked(actions) {
            let origin = Location { lat: -23.55, lng: -46.63 };
            let dest = Location { lat: -23.58, lng: -46.65 };
            
            self.current_ride = Some(Ride::new(
                Did("did:zubi:passenger:me".to_string()), 
                origin, 
                dest
            ));
            
            self.label(id!(status_label)).set_text("Searching via Nostr...");
            self.redraw(cx);
        }
    }
}

app_main!(App);
