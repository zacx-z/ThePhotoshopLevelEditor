The Photoshop Level Editor
=======================

A Photoshop export script, to help create a world for a game engine in Photoshop.

## Installation

Two ways:

 - Put the jsx file under Presets/Scripts folder in the Photoshop Path, and restart the Photoshop. You can find it in *File > Scripts*.
 - *File > Scripts > Browse*, and open the jsx file.

## Usage

The scripts will export "components" in the document.
If a layer or a group's name begins with "cpn:", followed with its real name, it will be regarded as a component and will appear in the component list you can choose from.
If a component have frame-by-frame animation, it should be a layer group have a series layers (groups) named like "frame0", "frame1". Each frame will be automatically exported.

You can write a configure file for the document, named as *docname.psd.conf*, which is a xml file.

Example:
```xml
<config>
    <path value="export/path"></path>
</config>
```
