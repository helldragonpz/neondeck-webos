'use strict';
const assert=require('assert/strict'),{validate,usbVolumes}=require('../setup/manager');
const p={uid:0,node:'16.20.2',kernelArch:'aarch64',frontend:'7bfe584a43c4651e78408258eb3e45dc2074030982a3e1fce4edddb49dce4d34',home:{ours:true},freeBytes:200*1048576};validate(p);
for(const patch of [{uid:1},{node:'16.19.0'},{node:'8.0.0'},{kernelArch:'armv7l'},{home:{}},{frontend:'unknown'},{freeBytes:1},{busy:true}])assert.throws(()=>validate({...p,...patch}));
const mounted='/dev/sda1 /tmp/usb/sda/sda1 vfat rw 0 0\n/dev/sdb1 /media/usb\\040drive exfat rw 0 0\noverlay /var overlay rw 0 0\n/dev/root / ext4 rw 0 0\n';assert.deepEqual(usbVolumes(mounted,()=>true),['/tmp/usb/sda/sda1','/media/usb drive']);assert.deepEqual(usbVolumes(mounted,()=>false),[]);
console.log('PASS setup compatibility and USB mount discovery');
