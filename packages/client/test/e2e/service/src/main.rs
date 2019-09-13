use oasis_std::{Context, Service, Event};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Event)]
pub struct Incremented {
    #[indexed]
    pub new_counter: u64,
    pub inner: InnerCounter,
}

#[derive(Serialize, Deserialize)]
pub struct InnerCounter {
    pub inner_counter: u64,
}

#[derive(Service)]
pub struct Counter {
    count: u64
}

impl Counter {
    pub fn new(_ctx: &Context, start_count: u64) -> Result<Self, String> {
        Ok(Self { count: start_count })    }

    pub fn get_counter(&mut self, _ctx: &Context) -> Result<u64, String> {
        Ok(self.count)
    }

    pub fn set_counter(&mut self, _ctx: &Context, c: u64) -> Result<(), String> {
        self.count = c;
        Ok(())
    }

    pub fn increment_counter(&mut self, _ctx: &Context) -> Result<(), String> {
        self.count += 1;
        Event::emit(&Incremented {
            new_counter: self.count,
            inner: InnerCounter {
                inner_counter: self.count,
            },
        });
        Ok(())
    }
}

fn main() {
    oasis_std::service!(Counter);
}
