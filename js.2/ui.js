(function($) {
    JSNES.UI = function(nes, parent) {
        var self = this;
        self.nes = nes;
        
        self.root = $('<div></div>');
        self.screen = $('<canvas class="nes-screen" width="256" height="240"></canvas>').appendTo(self.root);
        self.controls = $('<div class="nes-controls"></div>').appendTo(self.root);
        self.romSelect = $('<select class="nes-roms"></select>').appendTo(self.controls);
        self.buttons = {
            pause: $('<input type="button" value="pause" class="nes-pause" disabled="disabled">').appendTo(self.controls),
            restart: $('<input type="button" value="restart" class="nes-restart" disabled="disabled">').appendTo(self.controls),
            sound: $('<input type="button" value="enable sound" class="nes-enablesound">').appendTo(self.controls),
            zoom: $('<input type="button" value="zoom in" class="nes-zoom">').appendTo(self.controls)
        };
        self.status = $('<p class="nes-status">Booting up...</p>').appendTo(self.root);
        self.root.appendTo(parent);
        
        self.romSelect.change(function() {
            self.updateStatus("Downloading...");
            $.ajax({
                url: escape(self.romSelect.val()),
                xhr: function() {
                    var xhr = $.ajaxSettings.xhr();
                    // Download as binary
                    xhr.overrideMimeType('text/plain; charset=x-user-defined');
                    return xhr;
                },
                success: function(data) {
                    self.nes.loadRom(data);
                    self.nes.start();
                    self.enable();
                }
            });
        });
        
        self.buttons.pause.click(function() {
            if (self.nes.isRunning) {
                self.nes.stop();
                self.updateStatus("Paused");
                self.buttons.pause.attr("value", "resume");
            }
            else {
                self.nes.start();
                self.buttons.pause.attr("value", "pause");
            }
        });
        
        self.buttons.restart.click(function() {
            self.nes.reloadRom();
            self.nes.start();
        });
        
        self.buttons.sound.click(function() {
            if (self.nes.opts.emulateSound) {
                self.nes.opts.emulateSound = false;
                self.buttons.sound.attr("value", "enable sound");
            }
            else {
                self.nes.opts.emulateSound = true;
                self.buttons.sound.attr("value", "disable sound");
            }
        });
        
        self.zoomed = false;
        self.buttons.zoom.click(function() {
            if (self.zoomed) {
                self.screen.animate({
                    width: '256px',
                    height: '240px'
                });
                self.buttons.zoom.attr("value", "zoom in");
                self.zoomed = false;
            }
            else {
                self.screen.animate({
                    width: '512px',
                    height: '480px'
                });
                self.buttons.zoom.attr("value", "zoom out");
                self.zoomed = true;
            }
        });
        
        // Mouse experiments. Requires jquery.dimensions.js
        if ($.offset) {
            self.screen.mousedown(function(e) {
                if (self.nes.mmap) {
                    self.nes.mmap.mousePressed = true;
                    // FIXME: does not take into account zoom
                    self.nes.mmap.mouseX = e.pageX - self.screen.offset().left;
                    self.nes.mmap.mouseY = e.pageY - self.screen.offset().top;
                }
            }).mouseup(function() {
                setTimeout(function() {
                    if (self.nes.mmap) {
                        self.nes.mmap.mousePressed = false;
                        self.nes.mmap.mouseX = 0;
                        self.nes.mmap.mouseY = 0;
                    }
                }, 500);
            });
        }
        
    };
    
    JSNES.UI.prototype = {
        updateStatus: function(s) {
            this.status.text(s);
        },
        
        // Enable and reset UI elements
        enable: function() {
            this.buttons.pause.attr("disabled", null);
            if (this.nes.isRunning) {
                this.buttons.pause.attr("value", "pause");
            }
            else {
                this.buttons.pause.attr("value", "resume");
            }
            this.buttons.restart.attr("disabled", null);
            if (this.nes.opts.emulateSound) {
                this.buttons.sound.attr("value", "disable sound");
            }
            else {
                this.buttons.sound.attr("value", "enable sound");
            }
        },
        
        setRoms: function(roms) {
            this.romSelect.children().remove();
            $("<option>Select a ROM...</option>").appendTo(this.romSelect);
            for (var groupName in roms) {
                if (roms.hasOwnProperty(groupName)) {
                    var optgroup = $('<optgroup></optgroup>').
                        attr("label", groupName);
                    for (var i = 0; i < roms[groupName].length; i++) {
                        $('<option>'+roms[groupName][i][0]+'</option>')
                            .attr("value", roms[groupName][i][1])
                            .appendTo(optgroup);
                    }
                    this.romSelect.append(optgroup);
                }
            }
        }
    };
    
})(jQuery);
